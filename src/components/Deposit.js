import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import BSAlert from 'react-bootstrap/Alert';
import { ethers } from 'ethers'

import Alert from './Alert'

import {
  addLiquidity,
  loadBalances
} from '../store/interactions'

const Deposit = () => {
  const [token1Amount, setToken1Amount] = useState(0)
  const [token2Amount, setToken2Amount] = useState(0)
  const [showAlert, setShowAlert] = useState(false)
  const [selectedAMM, setSelectedAMM] = useState('amm1') // Default to AMM1
  const [isPoolEmpty, setIsPoolEmpty] = useState(false)

  const provider = useSelector(state => state.provider.connection)
  const account = useSelector(state => state.provider.account)

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
  const isDepositing = useSelector(state => state.amm.depositing.isDepositing)
  const isSuccess = useSelector(state => state.amm.depositing.isSuccess)
  const transactionHash = useSelector(state => state.amm.depositing.transactionHash)
  const dispatch = useDispatch()

  const amountHandler = async (e) => {
    if (!amm) {
      console.warn('AMM contract not loaded yet')
      return
    }

    if (e.target.id === 'token1') {
      setToken1Amount(e.target.value)

      // Try to fetch ratio from chain (will fail if pool is empty)
      try {
        const _token1Amount = ethers.utils.parseUnits(e.target.value || '0', 'ether')
        const result = await amm.calculateToken2Deposit(_token1Amount)
        const _token2Amount = ethers.utils.formatUnits(result.toString(), 'ether')
        setToken2Amount(_token2Amount)
        setIsPoolEmpty(false) // Pool has liquidity
      } catch (error) {
        // Pool is empty - user can enter any ratio they want
        console.log('Pool is empty - allowing free deposit ratio')
        setIsPoolEmpty(true)
        // Don't auto-calculate, let user enter token2 amount manually
      }
    } else {
      setToken2Amount(e.target.value)

      // Try to fetch ratio from chain (will fail if pool is empty)
      try {
        const _token2Amount = ethers.utils.parseUnits(e.target.value || '0', 'ether')
        const result = await amm.calculateToken1Deposit(_token2Amount)
        const _token1Amount = ethers.utils.formatUnits(result.toString(), 'ether')
        setToken1Amount(_token1Amount)
        setIsPoolEmpty(false) // Pool has liquidity
      } catch (error) {
        // Pool is empty - user can enter any ratio they want
        console.log('Pool is empty - allowing free deposit ratio')
        setIsPoolEmpty(true)
        // Don't auto-calculate, let user enter token1 amount manually
      }
    }
  }

  const depositHandler = async (e) => {
    e.preventDefault()

    if (!amm) {
      window.alert('AMM contract not loaded. Please try refreshing the page.')
      return
    }

    if (!token1Amount || !token2Amount || 
        parseFloat(token1Amount) <= 0 || 
        parseFloat(token2Amount) <= 0) {
      window.alert('Please enter valid amounts for both tokens')
      return
    }

    setShowAlert(false)

    try {
      const _token1Amount = ethers.utils.parseUnits(token1Amount, 'ether')
      const _token2Amount = ethers.utils.parseUnits(token2Amount, 'ether')

      console.log('Adding liquidity with amounts:', {
        token1: token1Amount,
        token2: token2Amount
      })

      const tx = await addLiquidity(
        provider,
        { selected: selectedAMM, ...ammState },
        tokens,
        [_token1Amount, _token2Amount],
        dispatch
      )

      if (tx) {
        console.log('Liquidity added successfully, updating balances...')
        await loadBalances(ammState, tokens, account, dispatch)
        setShowAlert(true)
        
        // Reset form after successful deposit
        setToken1Amount('0')
        setToken2Amount('0')
      }
    } catch (error) {
      console.error('Deposit error:', error)
      setShowAlert(true) // Show error state
      window.alert(`Deposit failed: ${error.message || 'Unknown error occurred'}`)
    }
  }

  return (
    <div>
      <Card style={{ maxWidth: '450px' }} className='mx-auto px-4'>
        {account ? (
          <Form onSubmit={depositHandler} style={{ maxWidth: '450px', margin: '50px auto' }}>
            
            {/* Deposit Info */}
            <div className="text-center mb-3">
              <h5 className="mb-1">💰 Add Liquidity</h5>
              <p style={{ fontSize: '14px', margin: 0, color: '#495057' }}>
                Deposit tokens to earn trading fees. You'll receive LP shares.
              </p>
            </div>
            
            {/* AMM Pool Selector */}
            <Row className='my-3'>
              <Form.Group>
                <div>
                  <Form.Label className="mb-1"><strong>Select Liquidity Pool</strong></Form.Label>
                  <div style={{ fontSize: '13px', color: '#495057' }}>Choose which token pair to provide liquidity for</div>
                </div>
                <Form.Select 
                  value={selectedAMM}
                  onChange={(e) => {
                    setSelectedAMM(e.target.value)
                    setToken1Amount(0)
                    setToken2Amount(0)
                    setIsPoolEmpty(false) // Reset flag when switching pools
                  }}
                >
                  <option value="amm1">AMM1 - {symbols?.[1]}/{symbols?.[0]} (ETH/USD)</option>
                  <option value="amm2">AMM2 - {symbols?.[2]}/{symbols?.[0]} (OP/USD)</option>
                </Form.Select>
              </Form.Group>
            </Row>

            {/* Empty Pool Alert */}
            {isPoolEmpty && (
              <BSAlert variant="info" className="my-3" style={{ fontSize: '14px', padding: '12px 16px' }}>
                <strong>🏊 First Deposit!</strong> This pool is empty. Set any token ratio you want.
              </BSAlert>
            )}

            <Row>
              <Form.Text className='text-end my-2' muted>
                Balance: {balances?.[token1Index] || '0'}
              </Form.Text>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.000001"
                  id="token1"
                  onChange={(e) => amountHandler(e)}
                  value={token1Amount === 0 ? "" : token1Amount}
                  onFocus={(e) => e.target.value === '0' && setToken1Amount('')}
                  onBlur={(e) => !e.target.value && setToken1Amount(0)}
                />
                <InputGroup.Text style={{ width: "100px" }} className="justify-content-center">
                  { symbols?.[token1Index] || 'Token1' }
                </InputGroup.Text>
              </InputGroup>
            </Row>

            <Row className='my-3'>
              <Form.Text className='text-end my-2' muted>
                Balance:  {balances?.[token2Index] || '0'}
              </Form.Text>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0"
                  step="0.000001"
                  id="token2"
                  onChange={(e) => amountHandler(e)}
                  value={token2Amount === 0 ? "" : token2Amount}
                  onFocus={(e) => e.target.value === '0' && setToken2Amount('')}
                  onBlur={(e) => !e.target.value && setToken2Amount(0)}
                />
                <InputGroup.Text style={{ width: "100px" }} className="justify-content-center">
                  { symbols?.[token2Index] || 'Token2' }
                </InputGroup.Text>
              </InputGroup>
            </Row>

            <Row className='my-3'>
              <Button 
                type="submit"
                disabled={isDepositing}
                style={{ width: '100%' }}
              >
                {isDepositing ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Depositing...
                  </>
                ) : 'Deposit'}
              </Button>
            </Row>

            {/* Transaction Status - Permanent Area */}
            <Row className='mt-3'>
              <div style={{ 
                padding: '12px 16px', 
                background: isDepositing ? '#cfe2ff' : isSuccess && showAlert ? '#d1e7dd' : !isSuccess && showAlert ? '#f8d7da' : '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center',
                color: isDepositing ? '#084298' : isSuccess && showAlert ? '#0f5132' : !isSuccess && showAlert ? '#842029' : '#6c757d',
                fontSize: '14px',
                border: `1px solid ${isDepositing ? '#9ec5fe' : isSuccess && showAlert ? '#badbcc' : !isSuccess && showAlert ? '#f5c2c7' : '#dee2e6'}`,
                fontWeight: '500',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isDepositing ? (
                  <span>⏳ Deposit Pending...</span>
                ) : isSuccess && showAlert ? (
                  <div className="d-flex flex-column align-items-center">
                    <span>✅ Deposit Successful</span>
                    {transactionHash && (
                      <small className="mt-1">
                        <a href={`https://etherscan.io/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                          View Transaction
                        </a>
                      </small>
                    )}
                  </div>
                ) : !isSuccess && showAlert ? (
                  <span>❌ Deposit Failed</span>
                ) : (
                  <span>💡 Ready to deposit</span>
                )}
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

    </div>
  );
}

export default Deposit;
