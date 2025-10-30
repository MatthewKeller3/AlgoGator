import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  Card, 
  Form, 
  InputGroup, 
  Button, 
  Row, 
  Spinner,
  Modal
} from 'react-bootstrap'
import { ethers } from 'ethers'

import Alert from './Alert'

import {
  removeLiquidity,
  loadBalances
} from '../store/interactions'

const Withdraw = () => {
  const [amount, setAmount] = useState('')
  const [showAlert, setShowAlert] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedAMM, setSelectedAMM] = useState('amm1') // Default to AMM1
  const [estimatedAmounts, setEstimatedAmounts] = useState({ 
    token1: '0', 
    token2: '0',
    poolPercentage: '0'
  })

  const provider = useSelector(state => state.provider.connection)
  const account = useSelector(state => state.provider.account)

  const shares = useSelector(state => state.amm.shares)

  const tokens = useSelector(state => state.tokens.contracts)
  const symbols = useSelector(state => state.tokens.symbols)
  const balances = useSelector(state => state.tokens.balances)

  const ammState = useSelector(state => state.amm)
  const amm = selectedAMM === 'amm1' ? ammState?.amm1?.contract : ammState?.amm2?.contract
  
  // Get token indices for selected AMM
  // AMM1: ETH (index 1) / USD (index 0)
  // AMM2: OP (index 2) / USD (index 0)
  const token1Index = selectedAMM === 'amm1' ? 1 : 2  // ETH or OP
  const token2Index = 0  // USD for both
  const isWithdrawing = useSelector(state => state.amm.withdrawing.isWithdrawing)

  const dispatch = useDispatch()

  // Load balances when component mounts or account changes
  useEffect(() => {
    const loadComponentData = async () => {
      if (amm && tokens && account) {
        try {
          await loadBalances(amm, tokens, account, dispatch)
        } catch (error) {
          console.error('Error loading balances:', error)
        }
      }
    }
    
    loadComponentData()
  }, [account, amm, tokens, dispatch])


  // Format token amounts with specified decimal places, safely handle BigNumber and strings
  const formatTokenAmount = (amount, decimals = 4) => {
    try {
      // Handle null/undefined/empty string
      if (!amount) return '0'
      
      // Convert to string and trim
      const strAmount = amount.toString().trim()
      
      // Handle zero or empty string
      if (strAmount === '0' || strAmount === '0.0' || strAmount === '0.00' || strAmount === '0.000' || strAmount === '0.0000') {
        return '0'
      }
      
      // If it's a BigNumber, format it
      if (ethers.BigNumber.isBigNumber(amount)) {
        const formatted = ethers.utils.formatUnits(amount, 'ether')
        const num = parseFloat(formatted)
        return isNaN(num) ? '0' : num.toFixed(decimals).replace(/\.?0+$/, '')
      }
      
      // If it's a string or number, format it
      const num = parseFloat(strAmount)
      if (isNaN(num)) return '0'
      
      // Format with specified decimals and remove trailing zeros
      return num.toFixed(decimals).replace(/\.?0+$/, '')
    } catch (error) {
      console.error('Error formatting token amount:', error)
      return '0'
    }
  }

  // Calculate estimated token amounts and pool percentage
  const calculateEstimatedAmounts = async (shares) => {
    try {
      // Validate input
      if (!amm) {
        setEstimatedAmounts({ token1: '0', token2: '0', poolPercentage: '0' })
        return
      }
      
      // Convert to string and clean input
      const sharesStr = shares?.toString().trim() || '0'
      if (sharesStr === '' || sharesStr === '.' || isNaN(parseFloat(sharesStr)) || parseFloat(sharesStr) <= 0) {
        setEstimatedAmounts({ token1: '0', token2: '0', poolPercentage: '0' })
        return
      }

      // Parse shares to BigNumber
      let _shares
      try {
        _shares = ethers.utils.parseUnits(sharesStr, 'ether')
      } catch (e) {
        console.error('Error parsing shares:', e)
        setEstimatedAmounts({ token1: '0', token2: '0', poolPercentage: '0' })
        return
      }

      // Calculate withdrawal amounts
      let token1Amount, token2Amount
      try {
        [token1Amount, token2Amount] = await amm.calculateWithdrawAmount(_shares)
      } catch (e) {
        console.error('Error calculating withdraw amounts:', e)
        setEstimatedAmounts({ token1: '0', token2: '0', poolPercentage: '0' })
        return
      }
      
      // Calculate pool percentage
      let poolPercentage = '0'
      try {
        const totalShares = await amm.totalShares()
        if (totalShares.gt(0)) {
          const percentage = _shares.mul(10000).div(totalShares).toNumber() / 100
          poolPercentage = percentage.toFixed(2)
        }
      } catch (e) {
        console.error('Error calculating pool percentage:', e)
      }
      
      // Update state with formatted values
      setEstimatedAmounts({
        token1: formatTokenAmount(token1Amount, 6),
        token2: formatTokenAmount(token2Amount, 6),
        poolPercentage: poolPercentage
      })
    } catch (error) {
      console.error('Error calculating estimated amounts:', error)
      setEstimatedAmounts({ token1: '0', token2: '0', poolPercentage: '0' })
    }
  }

  const handleAmountChange = (value) => {
    // Only allow numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      
      // Don't calculate if empty or just a decimal point
      if (value === '' || value === '.') {
        setEstimatedAmounts({ token1: '0', token2: '0', poolPercentage: '0' })
        return
      }
      
      const numValue = parseFloat(value)
      // Only calculate if we have a valid positive number
      if (!isNaN(numValue) && numValue > 0) {
        calculateEstimatedAmounts(value)
      } else {
        setEstimatedAmounts({ token1: '0', token2: '0', poolPercentage: '0' })
      }
    }
  }

  // Set max shares
  const setMaxShares = () => {
    if (shares && parseFloat(shares) > 0) {
      // shares from Redux is already formatted as a string
      setAmount(shares)
      calculateEstimatedAmounts(shares)
    }
  }

  // Handle confirmation modal
  const handleConfirmation = (e) => {
    e.preventDefault()
    if (amount && !isNaN(amount) && amount > 0) {
      setShowConfirmModal(true)
    }
  }

  // Handle actual withdrawal after confirmation
  const confirmWithdraw = async () => {
    setShowConfirmModal(false)
    await executeWithdraw()
  }

  // Execute the withdrawal
  const executeWithdraw = async () => {
    if (!amm || !amount || isNaN(amount) || amount <= 0) {
      setShowAlert({
        show: true,
        message: 'Invalid withdrawal amount',
        variant: 'danger'
      })
      return
    }

    try {
      setShowAlert({ show: false })
      const _shares = ethers.utils.parseUnits(amount.toString(), 'ether')
      
      // Check if user has enough shares
      const userShares = await amm.shares(account)
      if (_shares.gt(userShares)) {
        setShowAlert({
          show: true,
          message: `Insufficient shares. You have ${ethers.utils.formatUnits(userShares, 'ether')} shares.`,
          variant: 'danger'
        })
        return
      }

      console.log('Initiating withdrawal of', amount, 'shares')
      const receipt = await removeLiquidity(
        provider,
        ammState,
        _shares,
        dispatch
      )

      // Refresh balances
      await loadBalances(ammState, tokens, account, dispatch)

      setShowAlert({
        show: true,
        message: 'Withdrawal successful!',
        variant: 'success',
        transactionHash: receipt.transactionHash
      })
      
      // Reset form
      setAmount('')
      setEstimatedAmounts({ kel: '0', usd: '0', poolPercentage: '0' })
      
    } catch (error) {
      console.error('Withdrawal error:', error)
      setShowAlert({
        show: true,
        message: `Withdrawal failed: ${error.message || 'Unknown error'}`,
        variant: 'danger'
      })
    }
  }

  const withdrawHandler = async (e) => {
    e.preventDefault()
    if (!amm) {
      console.warn('AMM contract not loaded yet')
      setShowAlert({
        show: true,
        message: 'AMM contract not loaded. Please try again.',
        variant: 'danger'
      })
      return
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      setShowAlert({
        show: true,
        message: 'Please enter a valid amount of shares to withdraw',
        variant: 'danger'
      })
      return
    }

    handleConfirmation(e)
  }

  return (
    <div>
      <Card style={{ maxWidth: '450px' }} className='mx-auto px-4'>
        {account ? (
          <Form onSubmit={withdrawHandler} style={{ maxWidth: '450px', margin: '50px auto' }}>
            
            {/* Withdraw Info */}
            <div className="text-center mb-3">
              <h5 className="mb-1">💸 Withdraw Liquidity</h5>
              <p style={{ fontSize: '14px', margin: 0, color: '#495057' }}>
                Remove liquidity and collect your tokens plus fees
              </p>
            </div>
            
            {/* AMM Pool Selector */}
            <Row className='my-3'>
              <Form.Group>
                <div>
                  <Form.Label className="mb-1"><strong>Select Liquidity Pool</strong></Form.Label>
                  <div style={{ fontSize: '13px', color: '#495057' }}>Select which pool to withdraw from</div>
                </div>
                <Form.Select 
                  value={selectedAMM}
                  onChange={(e) => {
                    setSelectedAMM(e.target.value)
                    setAmount('')
                    setEstimatedAmounts({ token1: '0', token2: '0', poolPercentage: '0' })
                  }}
                >
                  <option value="amm1">AMM1 - {symbols?.[1]}/{symbols?.[0]} (ETH/USD)</option>
                  <option value="amm2">AMM2 - {symbols?.[2]}/{symbols?.[0]} (OP/USD)</option>
                </Form.Select>
              </Form.Group>
            </Row>

            <Row>
              <Form.Text className='text-end my-2' muted>
                Shares: {shares ? formatTokenAmount(shares, 6) : '0'}
              </Form.Text>
              <InputGroup className="mb-2">
                <Form.Control
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.000001"
                  id="shares"
                  value={amount === 0 || amount === '' ? '' : amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onFocus={(e) => e.target.value === '0' && setAmount('')}
                  onBlur={(e) => !e.target.value && setAmount('')}
                  isInvalid={amount && (isNaN(amount) || amount <= 0)}
                  className="text-end"
                />
                <InputGroup.Text className="justify-content-center" style={{ width: '80px' }}>
                  Shares
                </InputGroup.Text>
                <Button 
                  variant="outline-secondary" 
                  onClick={setMaxShares}
                  style={{ width: '60px' }}
                >
                  Max
                </Button>
              </InputGroup>
              <div className="d-flex justify-content-between mb-3">
                <small className="text-muted">
                  Available: {shares ? formatTokenAmount(shares, 4) : '0'}
                </small>
                {estimatedAmounts.poolPercentage > 0 && (
                  <small className="text-muted">
                    {estimatedAmounts.poolPercentage}% of pool
                  </small>
                )}
              </div>
              
              {amount > 0 && (
                <div className="mb-3 p-3" style={{ 
                  backgroundColor: 'rgba(13, 110, 253, 0.05)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(13, 110, 253, 0.1)'
                }}>
                  <div className="text-center mb-2">
                    <small className="text-muted">You will receive approximately</small>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <div className="me-2" style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0d6efd' }}></div>
                      <span>{symbols?.[token1Index] || 'Token1'}</span>
                    </div>
                    <span className="fw-bold">{parseFloat(estimatedAmounts.token1).toFixed(4)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="me-2" style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#198754' }}></div>
                      <span>{symbols?.[token2Index] || 'Token2'}</span>
                    </div>
                    <span className="fw-bold">{parseFloat(estimatedAmounts.token2).toFixed(4)}</span>
                  </div>
                </div>
              )}
            </Row>

            <Row className='my-3'>
              <Button 
                type="submit" 
                variant="primary" 
                className="w-100 py-2"
                disabled={isWithdrawing || !amount || isNaN(amount) || amount <= 0}
              >
                {isWithdrawing ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Withdrawing...
                  </>
                ) : 'Withdraw'}
              </Button>
            </Row>

            {/* Transaction Status - Permanent Area */}
            <Row className='mt-3'>
              <div style={{ 
                padding: '12px 16px', 
                background: isWithdrawing ? '#cfe2ff' : showAlert?.variant === 'success' ? '#d1e7dd' : showAlert?.variant === 'danger' ? '#f8d7da' : '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center',
                color: isWithdrawing ? '#084298' : showAlert?.variant === 'success' ? '#0f5132' : showAlert?.variant === 'danger' ? '#842029' : '#6c757d',
                fontSize: '14px',
                border: `1px solid ${isWithdrawing ? '#9ec5fe' : showAlert?.variant === 'success' ? '#badbcc' : showAlert?.variant === 'danger' ? '#f5c2c7' : '#dee2e6'}`,
                fontWeight: '500',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isWithdrawing ? (
                  <span>⏳ Withdrawal Pending...</span>
                ) : showAlert?.variant === 'success' ? (
                  <div className="d-flex flex-column align-items-center">
                    <span>✅ Withdraw Successful</span>
                    {showAlert.transactionHash && (
                      <small className="mt-1">
                        <a href={`https://etherscan.io/tx/${showAlert.transactionHash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                          View Transaction
                        </a>
                      </small>
                    )}
                  </div>
                ) : showAlert?.variant === 'danger' ? (
                  <span>❌ {showAlert.message || 'Withdrawal Failed'}</span>
                ) : (
                  <span>💡 Ready to withdraw</span>
                )}
              </div>
            </Row>

            <hr />

            <Row className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  <div className="me-2" style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#0d6efd' }}></div>
                  <span>{symbols?.[token1Index] || 'Token1'} Balance:</span>
                </div>
                <span className="fw-bold">
                  {balances && balances[token1Index] ? formatTokenAmount(balances[token1Index], 4) : '0'}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="me-2" style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#198754' }}></div>
                  <span>{symbols?.[token2Index] || 'Token2'} Balance:</span>
                </div>
                <span className="fw-bold">
                  {balances && balances[token2Index] ? formatTokenAmount(balances[token2Index], 2) : '0'}
                </span>
              </div>
            </Row>

          </Form>

        ) : (
          <p
            className='d-flex justify-content-center align-items-center'
            style={{ height: '300px' }}
          >
            Please connect wallet.
          </p>
        )}
      </Card>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Withdrawal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">You are about to withdraw:</p>
          
          <div className="mb-3 p-3" style={{ 
            backgroundColor: 'rgba(13, 110, 253, 0.05)', 
            borderRadius: '8px',
            border: '1px solid rgba(13, 110, 253, 0.1)'
          }}>
            <div className="text-center mb-3">
              <h5>{amount} Shares</h5>
              <small className="text-muted">({estimatedAmounts.poolPercentage}% of pool)</small>
            </div>
            
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center">
                <div className="me-2" style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#0d6efd' }}></div>
                <span>{symbols?.[token1Index] || 'Token1'}</span>
              </div>
              <span className="fw-bold">{parseFloat(estimatedAmounts.token1).toFixed(4)}</span>
            </div>
            
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div className="me-2" style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#198754' }}></div>
                <span>{symbols?.[token2Index] || 'Token2'}</span>
              </div>
              <span className="fw-bold">{parseFloat(estimatedAmounts.token2).toFixed(4)}</span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-muted small">
              <i className="bi bi-info-circle me-1"></i>
              You will receive both tokens based on the current pool ratio.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <Button variant="outline-secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmWithdraw}>
            Confirm Withdrawal
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Withdraw;
