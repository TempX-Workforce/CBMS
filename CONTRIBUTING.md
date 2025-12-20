# Contributing to CBMS

Thank you for your interest in contributing to the College Budget Management System (CBMS)! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@cbms.com](mailto:conduct@cbms.com).

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **MongoDB** (v4.4 or higher)
- **Git** (latest version)
- **npm** or **yarn** (latest version)

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork the repository on GitHub
   # Then clone your fork
   git clone https://github.com/your-username/cbms.git
   cd cbms
   ```

2. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/original-username/cbms.git
   ```

3. **Install Dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

4. **Environment Setup**
   ```bash
   # Copy environment files
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   
   # Edit the environment files with your local settings
   # Note: For email notifications, configure SendGrid API key
   # See SENDGRID_SETUP.md for detailed instructions
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1: Start backend server
   cd server
   npm run dev
   
   # Terminal 2: Start frontend server
   cd client
   npm start
   ```

## 📝 Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **🐛 Bug Fixes**: Fix existing issues
- **✨ New Features**: Add new functionality
- **📚 Documentation**: Improve documentation
- **🧪 Tests**: Add or improve tests
- **🎨 UI/UX**: Improve user interface
- **⚡ Performance**: Optimize performance
- **🔒 Security**: Enhance security
- **🌐 Internationalization**: Add language support

### Contribution Process

1. **Check Existing Issues**: Look for existing issues or discussions
2. **Create an Issue**: If no existing issue, create one to discuss your contribution
3. **Fork and Branch**: Create a feature branch from `develop`
4. **Make Changes**: Implement your changes following our guidelines
5. **Test**: Ensure all tests pass and add new tests if needed
6. **Document**: Update documentation as necessary
7. **Submit PR**: Create a pull request with a clear description

### Branch Naming Convention

Use descriptive branch names with prefixes:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `test/description` - Test improvements
- `refactor/description` - Code refactoring
- `perf/description` - Performance improvements
- `security/description` - Security enhancements

Examples:
- `feature/user-authentication`
- `fix/login-validation-error`
- `docs/api-documentation-update`

## 🎯 Coding Standards

### JavaScript/Node.js Standards

- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **Async/Await**: Prefer async/await over Promises
- **Error Handling**: Always handle errors appropriately
- **Comments**: Add meaningful comments for complex logic

```javascript
// Good example
const getUserById = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Bad example
const getUserById = (id) => {
  return User.findById(id);
};
```

### React Standards

- **Functional Components**: Use functional components with hooks
- **PropTypes**: Define PropTypes for all components
- **State Management**: Use Context API for global state
- **Event Handlers**: Use descriptive handler names
- **Conditional Rendering**: Use clear conditional logic

```jsx
// Good example
const UserProfile = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSave = useCallback(async (userData) => {
    try {
      await onUpdate(userData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }, [onUpdate]);

  return (
    <div className="user-profile">
      {isEditing ? (
        <UserEditForm user={user} onSave={handleSave} />
      ) : (
        <UserDisplay user={user} onEdit={() => setIsEditing(true)} />
      )}
    </div>
  );
};

UserProfile.propTypes = {
  user: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};
```

### CSS Standards

- **BEM Methodology**: Use Block-Element-Modifier naming
- **Mobile First**: Design for mobile devices first
- **CSS Variables**: Use CSS custom properties for theming
- **Responsive Design**: Ensure all components are responsive

```css
/* Good example */
.user-profile {
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--color-background);
}

.user-profile__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.user-profile__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.user-profile--editing {
  border: 2px solid var(--color-primary);
}

@media (max-width: 768px) {
  .user-profile {
    padding: 0.5rem;
  }
}
```

### Database Standards

- **Mongoose Schemas**: Define clear schemas with validation
- **Indexes**: Add appropriate indexes for performance
- **Relationships**: Use proper references between collections
- **Validation**: Implement both client and server-side validation

```javascript
// Good example
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      message: 'Invalid email format'
    }
  },
  name: {
    first: { type: String, required: true, trim: true },
    last: { type: String, required: true, trim: true }
  },
  role: {
    type: String,
    enum: ['admin', 'office', 'department', 'hod', 'vice_principal', 'principal', 'auditor'],
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
```

## 🧪 Testing Guidelines

### Test Structure

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database operations
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Test system performance under load

### Writing Tests

```javascript
// Unit test example
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when valid ID is provided', async () => {
      const mockUser = { _id: '123', name: 'John Doe' };
      User.findById.mockResolvedValue(mockUser);
      
      const result = await userService.getUserById('123');
      
      expect(result).toEqual(mockUser);
      expect(User.findById).toHaveBeenCalledWith('123');
    });

    it('should throw error when user is not found', async () => {
      User.findById.mockResolvedValue(null);
      
      await expect(userService.getUserById('123')).rejects.toThrow('User not found');
    });
  });
});
```

### Test Coverage

- **Minimum Coverage**: 80% code coverage
- **Critical Paths**: 100% coverage for authentication and payment flows
- **New Features**: Must include tests for all new functionality
- **Bug Fixes**: Must include regression tests

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=user.test.js

# Run tests in watch mode
npm run test:watch
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update Documentation**: Update README, API docs, and code comments
2. **Add Tests**: Include tests for new functionality
3. **Check Coverage**: Ensure test coverage meets requirements
4. **Lint Code**: Fix all linting errors
5. **Test Locally**: Verify everything works in your environment

### PR Description Template

```markdown
## Description
Brief description of changes

## Related Issue
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
2. **Code Review**: At least one team member reviews the code
3. **Testing**: Reviewer tests the changes locally
4. **Approval**: PR must be approved before merging
5. **Merge**: PR is merged to the target branch

### PR Guidelines

- **Small PRs**: Keep PRs focused and small (< 400 lines)
- **Clear Description**: Provide clear description of changes
- **Screenshots**: Include screenshots for UI changes
- **Breaking Changes**: Clearly mark any breaking changes
- **Migration Guide**: Provide migration steps if needed

## 🐛 Issue Guidelines

### Bug Reports

When reporting bugs, please include:

- **Environment**: OS, Node.js version, browser version
- **Steps to Reproduce**: Clear, numbered steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Error Logs**: Relevant error messages

### Feature Requests

When requesting features, please include:

- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: How should it work?
- **Use Cases**: Specific scenarios where this would be useful
- **Alternatives**: Other solutions you've considered
- **Additional Context**: Any other relevant information

### Issue Labels

We use the following labels to categorize issues:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - High priority
- `priority: medium` - Medium priority
- `priority: low` - Low priority

## 📚 Documentation

### Code Documentation

- **JSDoc Comments**: Document all public functions and classes
- **README Updates**: Update README for new features
- **API Documentation**: Document all API endpoints
- **Inline Comments**: Add comments for complex logic

```javascript
/**
 * Creates a new user in the system
 * @param {Object} userData - User information
 * @param {string} userData.email - User's email address
 * @param {string} userData.name - User's full name
 * @param {string} userData.role - User's role in the system
 * @returns {Promise<Object>} Created user object
 * @throws {Error} When user creation fails
 */
const createUser = async (userData) => {
  // Implementation
};
```

### API Documentation

- **Endpoint Description**: Clear description of what the endpoint does
- **Parameters**: Document all parameters and their types
- **Response Format**: Show example responses
- **Error Codes**: Document possible error responses
- **Authentication**: Specify authentication requirements

### User Documentation

- **Installation Guide**: Step-by-step installation instructions
- **Configuration**: How to configure the system
- **User Guide**: How to use the application
- **Troubleshooting**: Common issues and solutions

## 🌐 Community

### Getting Help

- **GitHub Discussions**: Ask questions and discuss ideas
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check the wiki and README
- **Email**: Contact the maintainers directly

### Contributing to Documentation

- **Wiki**: Contribute to the project wiki
- **Examples**: Add code examples and tutorials
- **Translations**: Help translate documentation
- **Screenshots**: Add screenshots and diagrams

### Recognition

Contributors are recognized in:

- **README**: Listed in the contributors section
- **Release Notes**: Mentioned in release announcements
- **GitHub**: Shown in the contributors graph
- **Documentation**: Credited in relevant sections

## 🏷️ Labels and Milestones

### Issue Labels

- **Type**: `bug`, `enhancement`, `documentation`, `question`
- **Priority**: `priority: high`, `priority: medium`, `priority: low`
- **Component**: `frontend`, `backend`, `database`, `api`
- **Status**: `in progress`, `blocked`, `needs review`
- **Difficulty**: `good first issue`, `help wanted`, `expert`

### Milestones

- **Version Releases**: `v1.0.0`, `v1.1.0`, etc.
- **Sprints**: `Sprint 1`, `Sprint 2`, etc.
- **Features**: `User Management`, `Budget Tracking`, etc.

## 🔧 Development Tools

### Recommended Tools

- **VS Code**: Code editor with extensions
- **Postman**: API testing
- **MongoDB Compass**: Database management
- **GitHub Desktop**: Git GUI
- **Docker**: Containerization

### VS Code Extensions

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **GitLens**: Git integration
- **Thunder Client**: API testing
- **MongoDB for VS Code**: Database tools

### Git Hooks

We use Git hooks to ensure code quality:

- **Pre-commit**: Run linting and tests
- **Pre-push**: Run full test suite
- **Commit-msg**: Validate commit message format

## 📞 Contact

### Maintainers

- **Lead Developer**: [@maintainer](https://github.com/maintainer)
- **Backend Lead**: [@backend-lead](https://github.com/backend-lead)
- **Frontend Lead**: [@frontend-lead](https://github.com/frontend-lead)

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Email**: [maintainers@cbms.com](mailto:maintainers@cbms.com)
- **Discord**: [CBMS Community](https://discord.gg/cbms)

## 📄 License

By contributing to CBMS, you agree that your contributions will be licensed under the MIT License.

## 🙏 Acknowledgments

Thank you to all contributors who have helped make CBMS better:

- **Contributors**: [List of contributors]
- **Beta Testers**: [List of beta testers]
- **Documentation Writers**: [List of documentation contributors]
- **Community Moderators**: [List of moderators]

---

**Happy Contributing! 🎉**

If you have any questions about contributing, please don't hesitate to reach out to the maintainers or open a discussion on GitHub.
