import { useEffect, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Container, Row, Col, Card } from 'react-bootstrap'

// Components
import Navigation from './Navigation';
import Tabs from './Tabs';
import Swap from './Swap';
import Deposit from './Deposit';
import Withdraw from './Withdraw';
import Charts from './Charts';
import Aggregator from './Aggregator';
import GettingStarted from './GettingStarted';

import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadAMM
} from '../store/interactions'

function App() {

  const dispatch = useDispatch()

  const loadBlockchainData = useCallback(async () => {
    // Initiate provider
    const provider = await loadProvider(dispatch);

    if (!provider) {
      console.error('Failed to load provider');
      return;
    }

    try {
      // Fetch current network's chainId (e.g. hardhat: 31337, kovan: 42)
      const chainId = await loadNetwork(provider, dispatch);

      // Reload page when network changes
      const handleChainChanged = () => {
        window.location.reload();
      };

      const handleAccountsChanged = async () => {
        await loadAccount(dispatch);
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Initiate contracts
      await loadTokens(provider, chainId, dispatch);
      await loadAMM(provider, chainId, dispatch);

      // Cleanup event listeners
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    } catch (error) {
      console.error('Error loading blockchain data:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    loadBlockchainData()
  }, [loadBlockchainData]);

  return(
    <HashRouter>
      <div className="app-wrapper" style={{ 
        minHeight: '100vh', 
        background: `
          linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%),
          url('/algogator-bg.svg')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        paddingTop: '20px',
        paddingBottom: '40px',
        position: 'relative'
      }}>
        {/* Getting Started Guide - Fixed Left Side */}
        <div style={{ position: 'fixed', left: '150px', top: '280px', width: '300px', zIndex: 1000 }}>
          <GettingStarted />
        </div>

        <Container>
          
          {/* Professional Header */}
          <Navigation />

          {/* Main Content Area */}
          <Row className="justify-content-center mt-4">
            <Col lg={10} xl={8}>
              
              {/* Hero Section */}
              <Card className="mb-4 shadow-lg border-0" style={{ 
                background: `
                  linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 249, 250, 0.9)),
                  repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(102, 126, 234, 0.03) 35px, rgba(102, 126, 234, 0.03) 70px)
                `,
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                borderTop: '3px solid transparent',
                borderImage: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                borderImageSlice: 1
              }}>
                {/* Fun Background Graphics */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                  {/* Top Right Circle */}
                  <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1), transparent)',
                    border: '2px solid rgba(102, 126, 234, 0.1)'
                  }}></div>
                  
                  {/* Bottom Left Triangle */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-30px',
                    left: '-30px',
                    width: '0',
                    height: '0',
                    borderLeft: '100px solid transparent',
                    borderRight: '100px solid transparent',
                    borderBottom: '100px solid rgba(118, 75, 162, 0.05)',
                    transform: 'rotate(15deg)'
                  }}></div>
                  
                  {/* Floating Dots */}
                  <div style={{
                    position: 'absolute',
                    top: '30%',
                    left: '10%',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'rgba(102, 126, 234, 0.2)',
                    animation: 'float 4s ease-in-out infinite'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    top: '60%',
                    right: '15%',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'rgba(118, 75, 162, 0.15)',
                    animation: 'float 5s ease-in-out infinite 1s'
                  }}></div>
                </div>

                <Card.Body className="text-center py-4 px-4" style={{ position: 'relative', zIndex: 1 }}>
                  {/* Animated Alligator Icon */}
                  <div style={{
                    fontSize: '60px',
                    marginBottom: '15px',
                    animation: 'float 3s ease-in-out infinite',
                    display: 'inline-block'
                  }}>
                    🐊
                  </div>
                  
                  <h1 className="display-5 fw-bold mb-2" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    AlgoGator
                  </h1>
                  
                  <p className="text-muted mb-3" style={{ fontSize: '0.95rem', maxWidth: '550px', margin: '0 auto 1.5rem' }}>
                    Advanced DEX Aggregator - Find the best rates across multiple AMMs
                  </p>
                  
                  {/* Feature Grid */}
                  <div className="row g-2 justify-content-center">
                    <div className="col-md-4">
                      <div className="p-2 rounded" style={{ background: 'rgba(13, 110, 253, 0.08)' }}>
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>🔄</div>
                        <strong className="d-block text-primary" style={{ fontSize: '14px' }}>Multi-AMM Support</strong>
                        <small className="text-muted" style={{ fontSize: '11px' }}>Compare across pools</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-2 rounded" style={{ background: 'rgba(25, 135, 84, 0.08)' }}>
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>🎯</div>
                        <strong className="d-block text-success" style={{ fontSize: '14px' }}>Best Rate Discovery</strong>
                        <small className="text-muted" style={{ fontSize: '11px' }}>Always optimal prices</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-2 rounded" style={{ background: 'rgba(13, 202, 240, 0.08)' }}>
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>⚡</div>
                        <strong className="d-block text-info" style={{ fontSize: '14px' }}>Low Fees</strong>
                        <small className="text-muted" style={{ fontSize: '11px' }}>Minimal gas costs</small>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
              
              {/* CSS Animation */}
              <style>{`
                @keyframes float {
                  0%, 100% {
                    transform: translateY(0px) rotate(-5deg);
                  }
                  50% {
                    transform: translateY(-15px) rotate(5deg);
                  }
                }
              `}</style>

              {/* Navigation Tabs */}
              <Card className="mb-4 shadow border-0" style={{ 
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '15px'
              }}>
                <Card.Body className="px-4 py-3">
                  <Tabs />
                </Card.Body>
              </Card>

              {/* Main Trading Interface */}
              <Card className="shadow-lg border-0" style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                minHeight: '500px'
              }}>
                <Card.Body className="p-4">
                  <Routes>
                    <Route exact path="/" element={<Swap />} />
                    <Route path="/deposit" element={<Deposit />} />
                    <Route path="/withdraw" element={<Withdraw />} />
                    <Route path="/charts" element={<Charts />} />
                    <Route path="/aggregator" element={<Aggregator />} />
                  </Routes>
                </Card.Body>
              </Card>

            </Col>
          </Row>

          {/* Footer */}
          <Row className="mt-5">
            <Col className="text-center">
              <p className="text-white-50 mb-0">
                ⚡ Powered by Ethereum • Built with React & Hardhat
              </p>
            </Col>
          </Row>

        </Container>
      </div>
    </HashRouter>
  )
}

export default App;
