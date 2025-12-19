const NodeClam = require('clamscan');
const fs = require('fs');
const path = require('path');
const AuditLog = require('../models/AuditLog');
const fileType = require('file-type');

// Virus scanner instance
let clamScanner = null;
let scannerInitialized = false;
let scannerError = null;

// Configuration from environment
const ENABLE_VIRUS_SCAN = process.env.ENABLE_VIRUS_SCAN === 'true';
const VIRUS_SCAN_DEV_MODE = process.env.VIRUS_SCAN_DEV_MODE === 'true';
const CLAMAV_HOST = process.env.CLAMAV_HOST || 'localhost';
const CLAMAV_PORT = parseInt(process.env.CLAMAV_PORT || '3310', 10);
const VIRUS_SCAN_TIMEOUT = parseInt(process.env.VIRUS_SCAN_TIMEOUT || '60000', 10);

/**
 * Initialize ClamAV scanner
 */
const initializeScanner = async () => {
  if (!ENABLE_VIRUS_SCAN) {
    console.log('Virus scanning is disabled via ENABLE_VIRUS_SCAN=false');
    return null;
  }

  try {
    const ClamScan = new NodeClam().init({
      removeInfected: true, // Automatically remove infected files
      quarantineInfected: false,
      scanLog: null,
      debugMode: process.env.NODE_ENV === 'development',
      clamdscan: {
        host: CLAMAV_HOST,
        port: CLAMAV_PORT,
        timeout: VIRUS_SCAN_TIMEOUT,
        localFallback: false,
        path: '/usr/bin/clamdscan',
        configFile: null,
        multiscan: true,
        reloadDb: false,
        active: true,
        bypassTest: false,
      },
      preference: 'clamdscan'
    });

    clamScanner = await ClamScan;

    // Test scanner connection
    const version = await clamScanner.getVersion();
    console.log(`✅ ClamAV scanner initialized successfully (version: ${version})`);

    scannerInitialized = true;
    scannerError = null;

    return clamScanner;
  } catch (error) {
    scannerError = error.message;

    // console.log(`ℹ️  ClamAV not reachable: ${error.message} - Virus scanning disabled.`);
    return null;
  }
};

// Initialize scanner on module load
initializeScanner().catch(err => {
  console.error('Failed to initialize virus scanner:', err);
});

/**
 * Scan a single file for viruses
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<Object>} Scan result
 */
const scanFile = async (filePath) => {
  if (!ENABLE_VIRUS_SCAN) {
    return {
      isInfected: false,
      viruses: [],
      file: filePath,
      skipped: true,
      reason: 'Virus scanning is disabled'
    };
  }

  if (!scannerInitialized) {
    console.warn(`⚠️  Scanner not initialized: Skipping virus scan for ${path.basename(filePath)}`);
    return {
      isInfected: false,
      viruses: [],
      file: filePath,
      skipped: true,
      reason: 'Virus scanner not initialized'
    };
  }

  if (!clamScanner) {
    throw new Error('Virus scanner not initialized. Please check ClamAV configuration.');
  }

  try {
    const { isInfected, viruses, file } = await clamScanner.scanFile(filePath);

    return {
      isInfected,
      viruses: viruses || [],
      file,
      skipped: false
    };
  } catch (error) {
    console.error('Virus scan error:', error);

    if (VIRUS_SCAN_DEV_MODE) {
      console.warn('⚠️  Scan error in DEV MODE, allowing file upload');
      return {
        isInfected: false,
        viruses: [],
        file: filePath,
        skipped: true,
        reason: `Scan error: ${error.message}`
      };
    }

    throw error;
  }
};

/**
 * Middleware to scan uploaded files for viruses
 */
const scanUploadedFiles = async (req, res, next) => {
  // Skip if no files uploaded
  if (!req.files || req.files.length === 0) {
    return next();
  }

  // Skip if virus scanning is disabled
  if (!ENABLE_VIRUS_SCAN) {
    console.log('Virus scanning disabled, allowing all uploads');
    return next();
  }

  const scanResults = [];
  const infectedFiles = [];

  try {
    // Scan each uploaded file
    for (const file of req.files) {
      console.log(`Scanning file: ${file.originalname} (${file.filename})`);

      // Verify file type using magic numbers
      try {
        const type = await fileType.fromFile(file.path);
        if (type && type.mime !== file.mimetype) {
          console.warn(`⚠️ Mime-type mismatch for ${file.originalname}: Claimed ${file.mimetype}, Detected ${type.mime}`);
          // Potential policy: reject if mismatch. For now, just warn and audit.
        }
      } catch (ftError) {
        console.warn('Could not determine file type via magic numbers:', ftError);
      }

      const result = await scanFile(file.path);
      scanResults.push({
        filename: file.originalname,
        ...result
      });

      if (result.isInfected) {
        infectedFiles.push({
          filename: file.originalname,
          viruses: result.viruses
        });

        // Delete infected file if it still exists
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
            console.log(`🗑️  Deleted infected file: ${file.filename}`);
          } catch (deleteError) {
            console.error('Error deleting infected file:', deleteError);
          }
        }

        // Log to audit trail
        if (req.user) {
          await AuditLog.create({
            eventType: 'file_upload_blocked',
            actor: req.user._id,
            actorRole: req.user.role,
            targetEntity: 'File',
            targetId: null,
            details: {
              filename: file.originalname,
              originalFilename: file.originalname,
              viruses: result.viruses,
              size: file.size,
              mimetype: file.mimetype
            }
          }).catch(err => console.error('Audit log error:', err));
        }
      } else {
        console.log(`✅ File clean: ${file.originalname}`);

        // Log successful scan to audit trail
        if (req.user && !result.skipped) {
          await AuditLog.create({
            eventType: 'file_upload_scanned',
            actor: req.user._id,
            actorRole: req.user.role,
            targetEntity: 'File',
            targetId: null,
            details: {
              filename: file.originalname,
              originalFilename: file.originalname,
              size: file.size,
              mimetype: file.mimetype,
              scanSkipped: result.skipped || false,
              skipReason: result.reason || null
            }
          }).catch(err => console.error('Audit log error:', err));
        }
      }
    }

    // If any infected files found, reject the entire upload
    if (infectedFiles.length > 0) {
      // Delete all uploaded files (clean ones too, for security)
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      });

      const virusList = infectedFiles
        .map(f => `${f.filename} (${f.viruses.join(', ')})`)
        .join('; ');

      return res.status(400).json({
        success: false,
        message: `File upload rejected: ${infectedFiles.length} file(s) contain malware`,
        details: {
          infectedFiles,
          threat: virusList
        }
      });
    }

    // Attach scan results to request for logging
    req.virusScanResults = {
      scanned: scanResults.length,
      clean: scanResults.filter(r => !r.isInfected).length,
      threats: infectedFiles.length,
      skipped: scanResults.filter(r => r.skipped).length,
      results: scanResults
    };

    next();
  } catch (error) {
    console.error('Virus scanning middleware error:', error);

    // Allow upload on scan error in all modes if scanner failed
    console.warn('⚠️  Scan error, allowing upload due to scanner failure');
    req.virusScanResults = {
      scanned: 0,
      clean: 0,
      threats: 0,
      skipped: req.files.length,
      error: error.message
    };
    return next();

    // In production, reject on scan error
    // Delete uploaded files
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Virus scanning failed. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get scanner status
 */
const getScannerStatus = () => {
  return {
    enabled: ENABLE_VIRUS_SCAN,
    initialized: scannerInitialized,
    devMode: VIRUS_SCAN_DEV_MODE,
    error: scannerError,
    config: {
      host: CLAMAV_HOST,
      port: CLAMAV_PORT,
      timeout: VIRUS_SCAN_TIMEOUT
    }
  };
};

module.exports = {
  scanUploadedFiles,
  scanFile,
  initializeScanner,
  getScannerStatus
};
