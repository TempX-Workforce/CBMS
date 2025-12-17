import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAuth } from '../context/AuthContext';
import { reportAPI } from '../services/api';
import PageHeader from '../components/Common/PageHeader';
import StatCard from '../components/Common/StatCard';
import ContentCard from '../components/Common/ContentCard';
import {
  Wallet,
  PieChart,
  FileText,
  CreditCard,
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      allocated: { value: 0, trend: 0 },
      utilized: { value: 0, trend: 0 },
      requests: { value: 0, trend: 0 },
      balance: { value: 0, trend: 0 }
    },
    activities: []
  });
  const [barChartOption, setBarChartOption] = useState({});
  const [pieChartOption, setPieChartOption] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.getDashboardReport({ financialYear: '2023-2024' });
      
      if (response.data.success) {
        const { consolidated } = response.data.data;
        processDashboardData(consolidated);
      }
    } catch (error) {
      console.error("Dashboard fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  const processDashboardData = (data) => {
    // 1. Update Stats
    const allocated = data.totalAllocated || 0;
    const utilized = data.totalSpent || 0;
    const requests = data.statusBreakdown?.pending || 0; // Using count of pending requests
    const balance = allocated - utilized;
    
    // Calculate mock trends or real ones if available
    const getTrend = (val, mock) => val > 0 ? mock : 0;

    setDashboardData({
      stats: {
        allocated: { value: allocated, trend: 0 },
        utilized: { value: utilized, trend: 0 },
        requests: { value: requests, trend: 0 },
        balance: { value: balance, trend: 0 }
      },
      activities: [] 
    });

    // 2. Process Bar Chart (Monthly Trend) - SAME LOGIC AS BEFORE
    const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const expenditureData = [];
    const trendMap = data.monthlyTrend || {};
    const [startYearStr] = data.financialYear.split('-');
    const startYear = parseInt(startYearStr);
    
    const orderedMonthsISO = [
      `${startYear}-04`, `${startYear}-05`, `${startYear}-06`, 
      `${startYear}-07`, `${startYear}-08`, `${startYear}-09`, 
      `${startYear}-10`, `${startYear}-11`, `${startYear}-12`, 
      `${startYear + 1}-01`, `${startYear + 1}-02`, `${startYear + 1}-03`
    ];

    orderedMonthsISO.forEach(key => {
       expenditureData.push(trendMap[key] || 0);
    });

    const averageBudget = allocated / 12;
    const budgetData = Array(12).fill(Math.round(averageBudget));

    setBarChartOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['Avg. Monthly Budget', 'Expenditure'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: monthNames,
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
      series: [
        {
          name: 'Avg. Monthly Budget',
          type: 'bar',
          data: budgetData,
          itemStyle: { color: '#1a237e', borderRadius: [4, 4, 0, 0] },
          barWidth: 12
        },
        {
          name: 'Expenditure',
          type: 'bar',
          data: expenditureData,
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: 12
        }
      ]
    });

    // 3. Process Pie Chart (Department Breakdown) - SAME LOGIC AS BEFORE
    const deptBreakdown = data.departmentBreakdown || {};
    const pieData = Object.keys(deptBreakdown).map((deptName, index) => ({
      value: deptBreakdown[deptName].spent,
      name: deptName,
      itemStyle: { 
        color: ['#1a237e', '#3b82f6', '#9ca3af', '#10b981', '#f59e0b'][index % 5] 
      }
    })).filter(item => item.value > 0);

    setPieChartOption({
      tooltip: { 
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: { bottom: 0, left: 'center' },
      series: [
        {
          name: 'Expenditure Distribution',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
          data: pieData.length > 0 ? pieData : [{ value: 0, name: 'No Data' }]
        }
      ]
    });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="dashboard-container">
      <PageHeader 
        title="Dashboard" 
        subtitle="Financial Overview & Analytics"
      />

      {/* Top Stats Row */}
      <div className="stats-grid">
        <StatCard 
          title="Total Allocated" 
          value={formatCurrency(dashboardData.stats.allocated.value)}
          icon={<Wallet size={24} />}
          trend={dashboardData.stats.allocated.trend}
          color="var(--info)"
        />
        <StatCard 
          title="Total Utilized" 
          value={formatCurrency(dashboardData.stats.utilized.value)}
          icon={<PieChart size={24} />}
          trend={dashboardData.stats.utilized.trend}
          color="var(--success)"
        />
        <StatCard 
          title="Pending Approvals" 
          value={`${dashboardData.stats.requests.value}`}
          icon={<FileText size={24} />}
          trend={dashboardData.stats.requests.trend}
          color="var(--warning)"
        />
        <StatCard 
          title="Remaining Balance" 
          value={formatCurrency(dashboardData.stats.balance.value)}
          icon={<CreditCard size={24} />}
          trend={dashboardData.stats.balance.trend}
          color="var(--accents-purple, #7e22ce)" // Fallback or assume var
        />
      </div>

      {/* Charts Row */}
      <div className="charts-section">
        <ContentCard title="Budget vs. Expenditure (Financial Year)">
          <ReactECharts option={barChartOption} style={{ height: '320px', width: '100%' }} />
        </ContentCard>
        
        <ContentCard title="Department-wise Distribution">
          <ReactECharts option={pieChartOption} style={{ height: '320px', width: '100%' }} />
        </ContentCard>
      </div>

      {/* Recent Activity - Placeholder/Empty for now unless we fetch it separately or pass from main */}
      {/* 
         Since getDashboardReport doesn't return activities list, we might want to keep the old separate call
         OR just hide this section if no data. 
         For now, I'll assume we want to focus on charts. 
         But reusing the old 'expenditureAPI.getExpenditures' is safer if we want this table.
      */}
    </div>
  );
};

export default Dashboard;
