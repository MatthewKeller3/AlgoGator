import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Navbar from 'react-bootstrap/Navbar';
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import Modal from 'react-bootstrap/Modal'

import { loadAccount, loadBalances } from '../store/interactions'

import config from '../config.json'

const Navigation = () => {
  const [showHelp, setShowHelp] = useState(false)
  
  const chainId = useSelector(state => state.provider.chainId)
  const account = useSelector(state => state.provider.account)
  const tokens = useSelector(state => state.tokens.contracts)
  const amm = useSelector(state => state.amm)

  const dispatch = useDispatch()

  const connectHandler = async () => {
    const account = await loadAccount(dispatch)
    
    // Only load balances if AMM contracts are available
    if (amm && amm.amm1 && tokens && tokens.length >= 3) {
      await loadBalances(amm, tokens, account, dispatch)
    } else {
      console.warn('AMM contracts or tokens not yet loaded')
    }
  }

  const networkHandler = async (e) => {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: e.target.value }],
    })
  }

  return (
    <Navbar 
      className="shadow-sm border-0" 
      expand="lg"
      style={{ 
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 249, 250, 0.95))',
        backdropFilter: 'blur(10px)',
        borderRadius: '15px',
        padding: '12px 30px',
        borderBottom: '2px solid rgba(102, 126, 234, 0.1)',
        position: 'relative',
        zIndex: 1050
      }}
    >
      
      {/* Modern Logo & Brand */}
      <div className="d-flex align-items-center">
        <div 
          className="d-flex align-items-center justify-content-center me-2"
          style={{
            width: '45px',
            height: '45px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            fontSize: '22px'
          }}
        >
          🐊
        </div>
        <div>
          <Navbar.Brand 
            href="#" 
            className="mb-0 fw-bold d-flex align-items-center gap-2"
            style={{ 
              fontSize: '22px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.5px'
            }}
          >
            AlgoGator
            <span style={{ 
              fontSize: '11px', 
              color: '#6c757d',
              fontWeight: '500',
              background: 'rgba(102, 126, 234, 0.1)',
              padding: '2px 8px',
              borderRadius: '6px',
              letterSpacing: '0'
            }}>
              DEX Aggregator
            </span>
          </Navbar.Brand>
        </div>
      </div>

      <Navbar.Toggle aria-controls="nav" />
      <Navbar.Collapse id="nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>

        {/* Left Spacer - matches right controls width */}
        <div style={{ flex: '1 1 auto' }}></div>

        {/* Help Button - Centered */}
        <div style={{ flex: '0 0 auto' }}>
          <div
            onClick={() => setShowHelp(true)}
            style={{
              borderRadius: '20px',
              background: 'rgba(102, 126, 234, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              padding: '8px 16px',
              fontWeight: '600',
              color: '#667eea'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            title="Help & Guide"
          >
            <span style={{ fontSize: '16px' }}>❓</span>
            <span>Help</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="d-flex align-items-center gap-3" style={{ flex: '1 1 auto', justifyContent: 'flex-end' }}>

          {/* Network Selector */}
          <Form.Select
            aria-label="Network Selector"
            value={config[chainId] ? `0x${chainId.toString(16)}` : `0`}
            onChange={networkHandler}
            className="network-select"
            style={{ 
              maxWidth: '150px',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              fontSize: '13px',
              padding: '6px 10px',
              paddingRight: '30px',
              background: 'white',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none'
            }}
          >
            <option value="0" disabled>Network</option>
            <option value="0x7A69">🏠 Localhost</option>
            <option value="0x1">Ethereum</option>
            <option value="0xaa36a7">Sepolia</option>
          </Form.Select>

          {/* Faucets Dropdown */}
          <DropdownButton
            title="💧 Faucets"
            variant="outline-secondary"
            style={{
              borderRadius: '8px',
              fontSize: '13px',
              border: '1px solid #dee2e6',
              padding: '0'
            }}
            className="faucets-dropdown"
          >
              <Dropdown.Header>Ethereum Faucets</Dropdown.Header>
              <Dropdown.Item 
                href="https://sepoliafaucet.com/" 
                target="_blank"
                rel="noopener noreferrer"
              >
                ⟠ Sepolia Faucet
              </Dropdown.Item>
              <Dropdown.Item 
                href="https://www.alchemy.com/faucets/ethereum-sepolia" 
                target="_blank"
                rel="noopener noreferrer"
              >
                ⟠ Alchemy Sepolia
              </Dropdown.Item>
              <Dropdown.Item 
                href="https://faucet.quicknode.com/ethereum/sepolia" 
                target="_blank"
                rel="noopener noreferrer"
              >
                ⟠ QuickNode Sepolia
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Header>Optimism Faucets</Dropdown.Header>
              <Dropdown.Item 
                href="https://app.optimism.io/faucet" 
                target="_blank"
                rel="noopener noreferrer"
              >
                🔴 Optimism Sepolia
              </Dropdown.Item>
              <Dropdown.Item 
                href="https://www.alchemy.com/faucets/optimism-sepolia" 
                target="_blank"
                rel="noopener noreferrer"
              >
                🔴 Alchemy OP Sepolia
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Header>Multi-Chain</Dropdown.Header>
              <Dropdown.Item 
                href="https://faucets.chain.link/" 
                target="_blank"
                rel="noopener noreferrer"
              >
                🔗 Chainlink Faucets
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Item disabled className="text-muted small">
                💡 Tip: Use Sepolia testnet for testing
              </Dropdown.Item>
            </DropdownButton>

          {/* Account Info */}
          {account ? (
            <div 
              className="px-3 py-2 rounded-pill d-flex align-items-center gap-2"
              style={{ 
                background: 'linear-gradient(135deg, #28a745, #20c997)',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: '#fff',
                animation: 'pulse 2s infinite'
              }}></div>
              {account.slice(0, 6) + '...' + account.slice(38, 42)}
            </div>
          ) : (
            <Button 
              onClick={connectHandler}
              className="d-flex align-items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 20px',
                fontWeight: '600',
                fontSize: '13px',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ fontSize: '16px' }}>👛</span>
              Connect Wallet
            </Button>
          )}

        </div>
      </Navbar.Collapse>

      {/* CSS Animation for pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .faucets-dropdown button {
          font-size: 13px !important;
          padding: 6px 10px !important;
          background: white !important;
          color: #212529 !important;
        }
        
        .faucets-dropdown button:hover {
          background: #f8f9fa !important;
        }
      `}</style>

      {/* Help Modal */}
      <Modal show={showHelp} onHide={() => setShowHelp(false)} size="lg">
        <Modal.Header closeButton style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)', color: 'white' }}>
          <Modal.Title>🐊 AlgoGator - DEX Aggregator Guide</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          
          {/* What is AlgoGator */}
          <div className="mb-4">
            <h5 className="text-primary">🎯 What is AlgoGator?</h5>
            <p>
              AlgoGator is a <strong>DEX Aggregator</strong> that helps you find the best token swap rates across multiple 
              Automated Market Makers (AMMs). Instead of checking each DEX individually, AlgoGator compares prices 
              for you and executes your trade on the exchange with the best rate.
            </p>
          </div>

          {/* Key Features */}
          <div className="mb-4">
            <h5 className="text-primary">✨ Key Features</h5>
            <ul>
              <li><strong>Best Rate Discovery:</strong> Automatically compares rates across AMM1 (ETH/USD) and AMM2 (OP/USD)</li>
              <li><strong>Multi-Token Support:</strong> Trade USD, ETH, and OP tokens</li>
              <li><strong>Liquidity Pools:</strong> Add/remove liquidity to earn fees</li>
              <li><strong>Slippage Protection:</strong> Set your tolerance for price changes</li>
              <li><strong>Price Impact Warnings:</strong> Know the effect of your trade size</li>
            </ul>
          </div>

          {/* How to Use */}
          <div className="mb-4">
            <h5 className="text-primary">📖 How to Use AlgoGator</h5>
            
            <h6 className="mt-3">1️⃣ Connect Your Wallet</h6>
            <p className="ms-3">
              Click <strong>"Connect Wallet"</strong> in the top right. Make sure you're on the correct network 
              (Localhost 8545 for testing, or Sepolia for testnet).
            </p>

            <h6 className="mt-3">2️⃣ Get Testnet Tokens</h6>
            <p className="ms-3">
              Click <strong>"💧 Faucets"</strong> to get free testnet ETH and OP tokens. You'll need these to trade and test the app.
            </p>

            <h6 className="mt-3">3️⃣ Add Liquidity (Optional)</h6>
            <p className="ms-3">
              Go to <strong>"Deposit"</strong> tab → Select a pool (ETH/USD or OP/USD) → Enter amounts → Click "Deposit". 
              You'll earn a share of trading fees!
            </p>

            <h6 className="mt-3">4️⃣ Swap Tokens</h6>
            <p className="ms-3">
              <strong>Swap Tab:</strong> Direct swap on a single AMM<br/>
              <strong>Aggregator Tab:</strong> Compare both AMMs and get the best rate automatically
            </p>

            <h6 className="mt-3">5️⃣ Withdraw Liquidity</h6>
            <p className="ms-3">
              Go to <strong>"Withdraw"</strong> tab → Select pool → Enter shares to withdraw → Get your tokens back plus earned fees!
            </p>
          </div>

          {/* Tabs Explained */}
          <div className="mb-4">
            <h5 className="text-primary">📑 Tabs Explained</h5>
            <div className="ms-3">
              <p><strong>🔄 Swap:</strong> Trade tokens on a single AMM. Choose input/output tokens and amounts.</p>
              <p><strong>💰 Deposit:</strong> Add liquidity to earn fees. Choose a pool (ETH/USD or OP/USD) and deposit both tokens.</p>
              <p><strong>💸 Withdraw:</strong> Remove your liquidity and collect earned fees.</p>
              <p><strong>📊 Charts:</strong> View pool balances and token distribution.</p>
              <p><strong>🎯 Aggregator:</strong> Compare rates across both AMMs and automatically swap at the best price!</p>
            </div>
          </div>

          {/* Tips */}
          <div className="mb-4">
            <h5 className="text-primary">💡 Pro Tips</h5>
            <ul>
              <li>Use <strong>Aggregator</strong> for the best rates on large trades</li>
              <li>Set higher slippage (1-3%) for volatile markets</li>
              <li>Check price impact before confirming large swaps</li>
              <li>Add liquidity to both pools to earn fees from both</li>
              <li>Always test on Sepolia before using real funds</li>
            </ul>
          </div>

          {/* Supported Tokens */}
          <div className="mb-4">
            <h5 className="text-primary">🪙 Supported Tokens</h5>
            <div className="ms-3">
              <p>💵 <strong>USD:</strong> US Dollar stablecoin</p>
              <p>⟠ <strong>ETH:</strong> Ethereum</p>
              <p>🔴 <strong>OP:</strong> Optimism</p>
            </div>
          </div>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHelp(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowHelp(false)}
            style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)', border: 'none' }}
          >
            Got it! 🚀
          </Button>
        </Modal.Footer>
      </Modal>

    </Navbar>
  )
}

export default Navigation;
