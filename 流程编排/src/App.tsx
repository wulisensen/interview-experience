
import React from 'react';
import { ProcessOrchestrator } from './orchestrator/ProcessOrchestrator';
import { mockConfig } from './mock/config';
import { Layout, Typography } from 'antd';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>流程编排系统</Title>
        </div>
      </Header>
      
      <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <ProcessOrchestrator 
          config={mockConfig} 
          initialContext={{
            activityName: '',
            activityType: 'online'
          }} 
        />
      </Content>
      
      <Footer style={{ textAlign: 'center' }}>
        Activity Orchestrator ©2026 Powered by Trae
      </Footer>
    </Layout>
  );
}

export default App;
