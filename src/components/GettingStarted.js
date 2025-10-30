import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Badge, Collapse } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const GettingStarted = () => {
  const [poolsHaveLiquidity, setPoolsHaveLiquidity] = useState({ amm1: false, amm2: false })
  const [hasTokens, setHasTokens] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const account = useSelector(state => state.provider.account)
  const tokens = useSelector(state => state.tokens.contracts)
  const balances = useSelector(state => state.tokens.balances)
  const ammState = useSelector(state => state.amm)

  useEffect(() => {
    const checkStatus = async () => {
      if (!account || !tokens || !ammState) {
        setIsLoading(false)
        return
      }

      try {
        // Check if user has tokens
        const hasAnyTokens = balances && balances.some(balance => {
          try {
            return parseFloat(balance) > 0
          } catch {
            return false
          }
        })
        setHasTokens(hasAnyTokens)

        // Check if pools have liquidity
        const amm1Contract = ammState?.amm1?.contract
        const amm2Contract = ammState?.amm2?.contract

        if (amm1Contract) {
          try {
            const token1Reserve = await amm1Contract.token1Balance()
            const token2Reserve = await amm1Contract.token2Balance()
            setPoolsHaveLiquidity(prev => ({
              ...prev,
              amm1: token1Reserve.gt(0) && token2Reserve.gt(0)
            }))
          } catch (error) {
            console.log('Could not check AMM1 reserves')
          }
        }

        if (amm2Contract) {
          try {
            const token1Reserve = await amm2Contract.token1Balance()
            const token2Reserve = await amm2Contract.token2Balance()
            setPoolsHaveLiquidity(prev => ({
              ...prev,
              amm2: token1Reserve.gt(0) && token2Reserve.gt(0)
            }))
          } catch (error) {
            console.log('Could not check AMM2 reserves')
          }
        }
      } catch (error) {
        console.error('Error checking status:', error)
      }

      setIsLoading(false)
    }

    checkStatus()
  }, [account, tokens, balances, ammState])

  const getCompletionStatus = () => {
    if (!account) return 0
    if (!hasTokens) return 1
    if (!poolsHaveLiquidity.amm1 && !poolsHaveLiquidity.amm2) return 2
    if (!poolsHaveLiquidity.amm1 || !poolsHaveLiquidity.amm2) return 3
    return 4
  }

  const completionStep = getCompletionStatus()
  const isFullySetup = completionStep === 4

  if (isLoading || isDismissed || isFullySetup) {
    return null
  }

  const getCurrentMessage = () => {
    if (!account) {
      return { icon: '🔗', text: 'Connect your wallet', action: 'Click "Connect Wallet" in the top right' }
    }
    if (!hasTokens) {
      return { icon: '🪙', text: 'Get test tokens', action: 'Run: npx hardhat run scripts/mint_tokens.js --network localhost' }
    }
    if (!poolsHaveLiquidity.amm1 && !poolsHaveLiquidity.amm2) {
      return { icon: '🏊', text: 'Add liquidity to pools', action: 'Both AMM pools need liquidity before you can swap' }
    }
    if (!poolsHaveLiquidity.amm1 || !poolsHaveLiquidity.amm2) {
      const emptyPool = !poolsHaveLiquidity.amm1 ? 'AMM1 (ETH/USD)' : 'AMM2 (OP/USD)'
      return { icon: '⚡', text: `Add liquidity to ${emptyPool}`, action: 'Almost there! One more pool to set up' }
    }
    return { icon: '✅', text: 'All set!', action: '' }
  }

  const message = getCurrentMessage()
  const progress = Math.round((completionStep / 4) * 100)

  return (
    <Alert 
      variant="primary" 
      dismissible 
      onClose={() => setIsDismissed(true)}
      className="mb-0"
      style={{
        borderRadius: '10px',
        backgroundColor: '#cfe2ff',
        border: '2px solid #9ec5fe',
        color: '#052c65',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      <h6 className="mb-3" style={{ fontWeight: 'bold', color: '#052c65', borderBottom: '2px solid #9ec5fe', paddingBottom: '8px' }}>
        📘 Quick Start Guide
      </h6>
      <div className="d-flex align-items-start justify-content-between">
        <div className="flex-grow-1">
          <div className="d-flex align-items-center mb-2">
            <span style={{ fontSize: '20px' }} className="me-1">{message.icon}</span>
            <strong style={{ fontSize: '14px', color: '#052c65' }} className="me-1">{message.text}</strong>
            <Badge bg="dark" pill style={{ fontSize: '10px', padding: '4px 8px', fontWeight: 'bold' }}>{progress}%</Badge>
          </div>
          
          <Collapse in={isExpanded}>
            <div>
              <p className="mb-2" style={{ fontSize: '13px', color: '#052c65', fontWeight: '500', lineHeight: '1.3' }}>{message.action}</p>
              
              {/* Compact Progress Tracker */}
              <div className="d-flex flex-wrap gap-1 mb-2">
                <Badge bg={account ? 'success' : 'dark'} pill style={{ fontSize: '10px', padding: '4px 8px', fontWeight: 'bold' }}>Wallet</Badge>
                <Badge bg={hasTokens ? 'success' : 'dark'} pill style={{ fontSize: '10px', padding: '4px 8px', fontWeight: 'bold' }}>Tokens</Badge>
                <Badge bg={poolsHaveLiquidity.amm1 ? 'success' : 'dark'} pill style={{ fontSize: '10px', padding: '4px 8px', fontWeight: 'bold' }}>AMM1</Badge>
                <Badge bg={poolsHaveLiquidity.amm2 ? 'success' : 'dark'} pill style={{ fontSize: '10px', padding: '4px 8px', fontWeight: 'bold' }}>AMM2</Badge>
              </div>

              {(hasTokens && (!poolsHaveLiquidity.amm1 || !poolsHaveLiquidity.amm2)) && (
                <Link to="/deposit">
                  <Button variant="primary" size="sm" style={{ fontSize: '12px', padding: '5px 12px', width: '100%' }}>
                    Go to Deposit
                  </Button>
                </Link>
              )}
            </div>
          </Collapse>
        </div>
        
        {/* Toggle Details Button */}
        <Button 
          variant="link" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-decoration-none p-0 ms-3"
          style={{ fontSize: '22px', lineHeight: 1, color: '#052c65', fontWeight: 'bold' }}
        >
          {isExpanded ? '▲' : '▼'}
        </Button>
      </div>
    </Alert>
  )
}

export default GettingStarted
