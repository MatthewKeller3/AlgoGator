import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, Form, InputGroup, Button, Row, Col, Spinner, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { ethers } from 'ethers'

import EmptyPoolWarning from './EmptyPoolWarning'

import {
  loadBalances,
  swapViaAggregator
} from '../store/interactions'

const Aggregator = () => {
  const [inputToken, setInputToken] = useState(null)
  const [outputToken, setOutputToken] = useState(null)
  const [inputAmount, setInputAmount] = useState(0)
  const [outputAmount, setOutputAmount] = useState(0)
  const [price, setPrice] = useState(0)
  const [showAlert, setShowAlert] = useState(false)
  const [bestDex, setBestDex] = useState(null)
  const [rates, setRates] = useState({ amm1: 0, amm2: 0 })
  const [isSwapping, setIsSwapping] = useState(false)
  const [slippageTolerance, setSlippageTolerance] = useState(0.5) // Default 0.5%
  const [priceImpact, setPriceImpact] = useState(0)
  const [isApproved, setIsApproved] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  const provider = useSelector(state => state.provider.connection)
  const account = useSelector(state => state.provider.account)
  const tokens = useSelector(state => state.tokens.contracts)
  const symbols = useSelector(state => state.tokens.symbols)
  const balances = useSelector(state => state.tokens.balances)
  const amm = useSelector(state => state.amm)
  const dispatch = useDispatch()

  const [amm1Contract, setAmm1Contract] = useState(null)
  const [amm2Contract, setAmm2Contract] = useState(null)
  const [aggregatorContract, setAggregatorContract] = useState(null)
  const [poolsEmpty, setPoolsEmpty] = useState({ amm1: true, amm2: true })

  // Check if pools have liquidity
  useEffect(() => {
    const checkPoolLiquidity = async () => {
      if (amm1Contract) {
        try {
          const token1Balance = await amm1Contract.token1Balance()
          const token2Balance = await amm1Contract.token2Balance()
          setPoolsEmpty(prev => ({
            ...prev,
            amm1: token1Balance.isZero() || token2Balance.isZero()
          }))
        } catch (error) {
          console.log('Could not check AMM1 liquidity')
        }
      }
      if (amm2Contract) {
        try {
          const token1Balance = await amm2Contract.token1Balance()
          const token2Balance = await amm2Contract.token2Balance()
          setPoolsEmpty(prev => ({
            ...prev,
            amm2: token1Balance.isZero() || token2Balance.isZero()
          }))
        } catch (error) {
          console.log('Could not check AMM2 liquidity')
        }
      }
    }
    checkPoolLiquidity()
  }, [amm1Contract, amm2Contract])

  useEffect(() => {
    if (provider && amm && amm.amm1 && amm.amm1.contract && !amm1Contract) {
      setAmm1Contract(amm.amm1.contract)
    }
    if (provider && amm && amm.amm2 && amm.amm2.contract && !amm2Contract) {
      setAmm2Contract(amm.amm2.contract)
    }
    if (provider && amm && amm.aggregator && amm.aggregator.contract && !aggregatorContract) {
      setAggregatorContract(amm.aggregator.contract)
    }
  }, [provider, amm, amm1Contract, amm2Contract, aggregatorContract])

  const inputHandler = useCallback(async (e) => {
    if (!inputToken || !outputToken) return;

    const value = e.target.value;
    setInputAmount(value);

    if (value === '' || value === '0') {
      setOutputAmount('0');
      setPrice(0);
      setBestDex(null);
      setRates({ amm1: 0, amm2: 0 });
      return;
    }

    try {
      // Get rates from both AMMs
      const amount = ethers.utils.parseEther(value.toString());
      
      let amm1Rate = 0;
      let amm2Rate = 0;
      
      if (amm1Contract && amm2Contract && tokens && tokens[0] && tokens[1]) {
        if (inputToken === tokens[0] && outputToken === tokens[1]) {
          // Token1 -> Token2
          amm1Rate = await amm1Contract.calculateToken1Swap(amount);
          amm2Rate = await amm2Contract.calculateToken1Swap(amount);
        } else if (inputToken === tokens[1] && outputToken === tokens[0]) {
          // Token2 -> Token1
          amm1Rate = await amm1Contract.calculateToken2Swap(amount);
          amm2Rate = await amm2Contract.calculateToken2Swap(amount);
        }

        const amm1Output = parseFloat(ethers.utils.formatEther(amm1Rate));
        const amm2Output = parseFloat(ethers.utils.formatEther(amm2Rate));

        setRates({ amm1: amm1Output, amm2: amm2Output });

        // Determine best DEX
        const bestOutput = Math.max(amm1Output, amm2Output);
        if (amm1Output > amm2Output) {
          setBestDex('AMM1');
          setOutputAmount(amm1Output);
          setPrice(amm1Output / parseFloat(value));
        } else {
          setBestDex('AMM2');
          setOutputAmount(amm2Output);
          setPrice(amm2Output / parseFloat(value));
        }

        // Calculate price impact
        const expectedPrice = bestOutput / parseFloat(value);
        const averageRate = (amm1Output + amm2Output) / 2 / parseFloat(value);
        const impact = Math.abs((expectedPrice - averageRate) / averageRate * 100);
        setPriceImpact(impact);
      }
    } catch (error) {
      console.error('Error calculating rates:', error);
    }
  }, [inputToken, outputToken, amm1Contract, amm2Contract, tokens]);

  // Check token approval
  const checkApproval = useCallback(async () => {
    if (!inputToken || !aggregatorContract || !account) return;

    try {
      const allowance = await inputToken.allowance(account, aggregatorContract.address);
      const amountToSwap = ethers.utils.parseEther(inputAmount.toString() || '0');
      setIsApproved(allowance.gte(amountToSwap) && amountToSwap.gt(0));
    } catch (error) {
      console.error('Error checking approval:', error);
      setIsApproved(false);
    }
  }, [inputToken, aggregatorContract, account, inputAmount]);

  useEffect(() => {
    checkApproval();
  }, [checkApproval]);

  const approveToken = async () => {
    setIsApproving(true);
    try {
      const signer = provider.getSigner();
      const tx = await inputToken.connect(signer).approve(
        aggregatorContract.address,
        ethers.constants.MaxUint256
      );
      await tx.wait();
      await checkApproval();
      setShowAlert(false);
    } catch (error) {
      console.error('Approval failed:', error);
      window.alert(`Approval Failed: ${error.message || 'Unknown error'}`);
    }
    setIsApproving(false);
  };

  const swapHandler = async (e) => {
    e.preventDefault()
    setIsSwapping(true)
    setShowAlert(false)

    try {
      // Parse input amount to wei
      const amountInWei = ethers.utils.parseEther(inputAmount.toString())
      
      // Calculate minimum amount out with slippage tolerance
      const expectedOutput = ethers.utils.parseEther(outputAmount.toString());
      const slippageMultiplier = (100 - slippageTolerance) / 100;
      const minAmountOut = expectedOutput.mul(Math.floor(slippageMultiplier * 1000)).div(1000);
      
      let transaction
      
      if (inputToken === tokens[0] && outputToken === tokens[1]) {
        // Token1 -> Token2 via aggregator
        transaction = await swapViaAggregator(
          provider,
          aggregatorContract,
          inputToken,        // Pass token contract
          symbols[0],        // Pass token symbol
          amountInWei,
          minAmountOut,
          slippageTolerance,
          dispatch
        )
      } else {
        // Token2 -> Token1 via aggregator  
        transaction = await swapViaAggregator(
          provider,
          aggregatorContract,
          inputToken,        // Pass token contract
          symbols[1],        // Pass token symbol
          amountInWei,
          minAmountOut,
          slippageTolerance,
          dispatch
        )
      }

      if (transaction) {
        await transaction.wait()
        
        await loadBalances(amm, tokens, account, dispatch)
        setShowAlert(true)
        setInputAmount(0)
        setOutputAmount(0)
        setPrice(0)
        setBestDex(null)
        setRates({ amm1: 0, amm2: 0 })
      } else {
        throw new Error('Transaction failed to be created')
      }
    } catch (error) {
      console.error('Swap failed:', error)
      window.alert(`Swap Failed: ${error.message || 'Unknown error'}`)
    }

    setIsSwapping(false)
  }

  // Update output when input changes
  useEffect(() => {
    const updateOutput = async () => {
      if (inputToken && outputToken && inputAmount > 0) {
        await inputHandler({ target: { value: inputAmount } });
      }
    };
    updateOutput();
  }, [inputToken, outputToken, inputAmount, inputHandler]);

  return (
    <div>
      <Card style={{ maxWidth: '450px' }} className='mx-auto px-4'>
        {account ? (
          <Form onSubmit={swapHandler} style={{ maxWidth: '450px', margin: '50px auto' }}>
            {/* Aggregator Info */}
            <div className="text-center mb-3">
              <h5 className="mb-1">🎯 DEX Aggregator</h5>
              <p style={{ fontSize: '14px', margin: 0, color: '#495057' }}>
                Automatically finds the best rate across both AMMs
              </p>
            </div>

            {/* Show warning if pools are empty */}
            {(poolsEmpty.amm1 || poolsEmpty.amm2) && (
              <Alert variant="warning" className="mb-3" style={{ fontSize: '14px', padding: '12px 16px' }}>
                {poolsEmpty.amm1 && poolsEmpty.amm2 ? (
                  <>⚠️ Both pools are empty. <Link to="/deposit">Add liquidity</Link> to enable swapping.</>
                ) : poolsEmpty.amm1 ? (
                  <>⚠️ AMM1 (ETH/USD) is empty. <Link to="/deposit">Add liquidity</Link> for better rates.</>
                ) : (
                  <>⚠️ AMM2 (OP/USD) is empty. <Link to="/deposit">Add liquidity</Link> for better rates.</>
                )}
              </Alert>
            )}

            <Row className='my-3'>
              <div className='d-flex justify-content-between'>
                <Form.Label><strong>Input Token</strong></Form.Label>
                <Form.Text muted>
                  Balance: {
                    tokens && balances && inputToken ? (
                      balances[tokens.findIndex(t => t?.address === inputToken?.address)] || '0'
                    ) : '0'
                  }
                </Form.Text>
              </div>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.000001"
                  value={inputAmount === 0 ? "" : inputAmount}
                  onChange={(e) => inputHandler(e)}
                  onFocus={(e) => e.target.value === '0' && setInputAmount('')}
                  onBlur={(e) => !e.target.value && setInputAmount(0)}
                  disabled={!inputToken}
                />
                <Form.Select
                  aria-label="Default select example"
                  value={inputToken ? inputToken.address : ''}
                  onChange={(e) => setInputToken(tokens.find(token => token.address === e.target.value))}
                >
                  <option value="">Select Token</option>
                  {tokens && symbols && tokens.map((token, index) => (
                    <option key={token.address} value={token.address}>
                      {symbols[index]}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Row>

            <Row className='my-4'>
              <div className='d-flex justify-content-between'>
                <Form.Label><strong>Output Token</strong></Form.Label>
                <Form.Text muted>
                  Balance: {
                    tokens && balances && outputToken ? (
                      balances[tokens.findIndex(t => t?.address === outputToken?.address)] || '0'
                    ) : '0'
                  }
                </Form.Text>
              </div>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0"
                  min="0"
                  step="any"
                  value={outputAmount === 0 ? "" : outputAmount}
                  disabled
                />
                <Form.Select
                  aria-label="Default select example"
                  value={outputToken ? outputToken.address : ''}
                  onChange={(e) => setOutputToken(tokens.find(token => token.address === e.target.value))}
                  disabled={!inputToken}
                >
                  <option value="">Select Token</option>
                  {tokens && symbols && tokens.map((token, index) => (
                    <option 
                      key={token.address} 
                      value={token.address}
                      disabled={inputToken?.address === token.address}
                    >
                      {symbols[index]}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Row>

            <Row className='my-3'>
              <Col>
                <Form.Group>
                  <div>
                    <Form.Label className="mb-1"><strong>Slippage Tolerance</strong></Form.Label>
                    <div style={{ fontSize: '13px', color: '#495057' }}>Max price change you'll accept</div>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <Button 
                      variant={slippageTolerance === 0.1 ? 'primary' : 'outline-primary'} 
                      size="sm"
                      onClick={() => setSlippageTolerance(0.1)}
                    >
                      0.1%
                    </Button>
                    <Button 
                      variant={slippageTolerance === 0.5 ? 'primary' : 'outline-primary'} 
                      size="sm"
                      onClick={() => setSlippageTolerance(0.5)}
                    >
                      0.5%
                    </Button>
                    <Button 
                      variant={slippageTolerance === 1.0 ? 'primary' : 'outline-primary'} 
                      size="sm"
                      onClick={() => setSlippageTolerance(1.0)}
                    >
                      1.0%
                    </Button>
                    <InputGroup style={{ width: '120px' }}>
                      <Form.Control
                        type="number"
                        size="sm"
                        min="0.1"
                        step="any"
                        value={slippageTolerance}
                        onChange={(e) => setSlippageTolerance(parseFloat(e.target.value) || 0.5)}
                        max="50"
                      />
                      <InputGroup.Text>%</InputGroup.Text>
                    </InputGroup>
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {inputAmount > 0 && outputAmount > 0 && (
              <Row className='my-3'>
                <Col>
                  <Alert variant={priceImpact > 5 ? 'warning' : 'info'}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <strong>Best Route:</strong> <span className="ms-1">{bestDex}</span>
                        <div style={{ fontSize: '13px', color: '#495057', marginTop: '2px' }}>This AMM offers the best rate</div>
                      </div>
                      <div>
                        <strong>Price:</strong> {price?.toFixed(6)}
                      </div>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between mb-2">
                      <div>AMM1: {rates.amm1?.toFixed(6)}</div>
                      <div>AMM2: {rates.amm2?.toFixed(6)}</div>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong>Price Impact:</strong> 
                        <span className={`ms-1 ${priceImpact > 5 ? 'text-danger' : ''}`}>{priceImpact.toFixed(2)}%</span>
                        <div style={{ fontSize: '13px', color: '#495057', marginTop: '2px' }}>How your trade affects price. Above 5% is risky</div>
                      </div>
                      <div>
                        <strong>Min Received:</strong> {(outputAmount * (1 - slippageTolerance / 100)).toFixed(6)}
                      </div>
                    </div>
                    {priceImpact > 5 && (
                      <Alert variant="danger" className="mt-2 mb-0">
                        ⚠️ High price impact! Consider swapping a smaller amount.
                      </Alert>
                    )}
                  </Alert>
                </Col>
              </Row>
            )}

            <Row className='my-3'>
              {!isApproved && inputAmount > 0 ? (
                <Button 
                  onClick={approveToken} 
                  variant="warning" 
                  size="lg"
                  disabled={isApproving}
                >
                  {isApproving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Approving...
                    </>
                  ) : (
                    `Approve ${inputToken === tokens[0] ? symbols[0] : symbols[1]}`
                  )}
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg"
                  disabled={isSwapping || !isApproved || inputAmount <= 0}
                  style={{ width: '100%' }}
                >
                  {isSwapping ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Swapping via {bestDex || 'Aggregator'}...
                    </>
                  ) : `Swap via ${bestDex || 'Aggregator'}`}
                </Button>
              )}
            </Row>

            {/* Transaction Status - Permanent Area */}
            <Row className='mt-3'>
              <div style={{ 
                padding: '12px 16px', 
                background: isSwapping ? '#cfe2ff' : showAlert ? '#d1e7dd' : '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center',
                color: isSwapping ? '#084298' : showAlert ? '#0f5132' : '#6c757d',
                fontSize: '14px',
                border: `1px solid ${isSwapping ? '#9ec5fe' : showAlert ? '#badbcc' : '#dee2e6'}`,
                fontWeight: '500',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isSwapping ? (
                  <span>⏳ Swap Pending via {bestDex}...</span>
                ) : showAlert ? (
                  <span>✅ Swap Successful via {bestDex}!</span>
                ) : (
                  <span>💡 Ready to find best rate</span>
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
  )
}

export default Aggregator
