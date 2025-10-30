import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Table from 'react-bootstrap/Table';
import Chart from 'react-apexcharts';
import { ethers } from 'ethers';
import { format } from 'date-fns';

import { options, series as initialSeries } from './Charts.config';
import { chartSelector } from '../store/selectors';
import Loading from './Loading';
import { loadAllSwaps } from '../store/interactions';

const Charts = () => {
  const dispatch = useDispatch();
  const provider = useSelector(state => state.provider.connection);
  const tokens = useSelector(state => state.tokens.contracts);
  const symbols = useSelector(state => state.tokens.symbols);
  const ammState = useSelector(state => state.amm);
  const amm1 = ammState?.amm1?.contract;
  const amm2 = ammState?.amm2?.contract;
  const chart = useSelector(chartSelector);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAMM, setSelectedAMM] = useState('both'); // 'amm1', 'amm2', or 'both'
  const [chartData, setChartData] = useState({
    series: [...initialSeries],
    options: { ...options }
  });

  // Process swaps data for the chart
  const processChartData = useMemo(() => {
    if (!chart?.swaps?.length) {
      console.log('No swap data available');
      return [];
    }
    
    try {
      console.log('Processing', chart.swaps.length, 'swaps');
      
      // Process each swap event
      const priceData = chart.swaps
        .map(swap => {
          try {
            // Handle both direct args and nested args from event
            const args = swap.args || {};
            const timestamp = swap.timestamp || args.timestamp;
            const tokenGetAmount = args.tokenGetAmount || args.amountGet;
            const tokenGiveAmount = args.tokenGiveAmount || args.amountGive;
            
            if (!timestamp || !tokenGetAmount || !tokenGiveAmount) {
              console.warn('Incomplete swap data:', { timestamp, tokenGetAmount, tokenGiveAmount });
              return null;
            }
            
            // Convert values to numbers
            const timestampMs = Number(timestamp.toString()) * 1000; // Convert to milliseconds
            const getAmount = parseFloat(ethers.utils.formatUnits(tokenGetAmount, 'ether'));
            const giveAmount = parseFloat(ethers.utils.formatUnits(tokenGiveAmount, 'ether'));
            
            if (giveAmount === 0) {
              console.warn('Zero give amount in swap:', { getAmount, giveAmount });
              return null;
            }
            
            const price = getAmount / giveAmount;
            
            return {
              x: timestampMs,
              y: price,
              amm: swap.ammAddress || 'unknown',
              txHash: swap.hash
            };
          } catch (err) {
            console.error('Error processing swap:', err, swap);
            return null;
          }
        })
        .filter(Boolean) // Remove any null values
        .sort((a, b) => a.x - b.x); // Sort by timestamp
      
      console.log('Processed', priceData.length, 'valid price points');
      
      // Group by AMM address if needed, or show as a single series
      const ammGroups = priceData.reduce((acc, point) => {
        const ammKey = point.amm || 'default';
        if (!acc[ammKey]) {
          acc[ammKey] = [];
        }
        acc[ammKey].push(point);
        return acc;
      }, {});
      
      // Create series for each AMM
      const series = Object.entries(ammGroups).map(([ammAddress, data]) => ({
        name: ammAddress === 'default' 
          ? `${symbols?.[0]}/${symbols?.[1] || 'Token'}` 
          : `AMM ${ammAddress.slice(0, 6)}...${ammAddress.slice(-4)}`,
        data: data.map(p => ({ x: p.x, y: p.y }))
      }));
      
      return series;
    } catch (err) {
      console.error('Error processing chart data:', err);
      return [];
    }
  }, [chart?.swaps, symbols]);

  // Update chart data when processed data changes
  useEffect(() => {
    if (processChartData.length > 0) {
      setChartData(prev => ({
        ...prev,
        series: processChartData,
        options: {
          ...prev.options,
          xaxis: {
            ...prev.options.xaxis,
            type: 'datetime',
            labels: {
              ...prev.options.xaxis.labels,
              formatter: (value) => format(new Date(value), 'HH:mm')
            }
          },
          yaxis: {
            ...prev.options.yaxis,
            labels: {
              ...prev.options.yaxis.labels,
              formatter: (value) => value.toFixed(6)
            }
          },
          tooltip: {
            ...prev.options.tooltip,
            x: {
              ...prev.options.tooltip.x,
              formatter: (value) => format(new Date(value), 'PPpp')
            },
            y: {
              ...prev.options.tooltip.y,
              formatter: (value) => `$${value.toFixed(6)}`
            }
          }
        }
      }));
    }
  }, [processChartData]);

  // Load swap data
  useEffect(() => {
    const fetchData = async () => {
      if (provider && (amm1 || amm2)) {
        try {
          setLoading(true);
          setError(null);
          
          // Load swaps from both AMMs
          const promises = [];
          if (amm1) {
            console.log('Loading swaps from AMM1');
            promises.push(loadAllSwaps(provider, amm1, dispatch));
          }
          if (amm2) {
            console.log('Loading swaps from AMM2');
            promises.push(loadAllSwaps(provider, amm2, dispatch));
          }
          
          await Promise.all(promises);
          console.log('Swap data loaded successfully');
        } catch (err) {
          console.error('Error loading swap data:', err);
          setError('Failed to load swap data. Please try again later.');
        } finally {
          setLoading(false);
        }
      } else {
        console.log('Provider or AMM contracts not available yet');
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up polling to refresh data
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [provider, amm1, amm2, dispatch]);

  if (loading) {
    return <Loading />;
  }


  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-body">
              <div className="mb-4">
                <h4>Trading History</h4>
                <p className="text-muted mb-0">
                  Tracking swaps from AMM1 (ETH/USD) and AMM2 (OP/USD)
                </p>
                {chart?.swaps && (
                  <small className="text-muted">
                    {chart.swaps.length} total swap{chart.swaps.length !== 1 ? 's' : ''} recorded
                  </small>
                )}
              </div>
              
              {error ? (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              ) : (
                <div className="chart-container" style={{ minHeight: '400px' }}>
                  {processChartData.length > 0 ? (
                    <Chart
                      type="line"
                      options={chartData.options}
                      series={chartData.series}
                      width="100%"
                      height="400"
                    />
                  ) : (
                    <div className="text-center py-5">
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                      <h5 className="mb-2">No Trading Data Yet</h5>
                      <p className="text-muted mb-3">
                        Start trading to see price history and charts
                      </p>
                      <div className="d-flex gap-2 justify-content-center">
                        <a href="#/swap" className="btn btn-sm btn-primary">
                          Make a Swap
                        </a>
                        <a href="#/aggregator" className="btn btn-sm btn-outline-primary">
                          Use Aggregator
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Recent Trades</h4>
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={async () => {
                    setLoading(true);
                    const promises = [];
                    if (amm1) promises.push(loadAllSwaps(provider, amm1, dispatch));
                    if (amm2) promises.push(loadAllSwaps(provider, amm2, dispatch));
                    await Promise.all(promises);
                    setLoading(false);
                  }}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              
              <div className="table-responsive">
                <Table striped bordered hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Tx Hash</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Amount</th>
                      <th>Total</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart?.swaps && chart.swaps.length > 0 ? (
                      [...chart.swaps]
                        .sort((a, b) => (b.args?.timestamp?.toNumber() || 0) - (a.args?.timestamp?.toNumber() || 0))
                        .slice(0, 10)
                        .map((swap, index) => {
                          if (!swap?.args) return null;
                          
                          const isBuy = tokens[0] && swap.args.tokenGive === tokens[0].address;
                          const baseSymbol = isBuy ? symbols[1] : symbols[0];
                          const quoteSymbol = isBuy ? symbols[0] : symbols[1];
                          
                          const baseAmount = isBuy 
                            ? parseFloat(ethers.utils.formatUnits(swap.args.tokenGetAmount || '0', 'ether'))
                            : parseFloat(ethers.utils.formatUnits(swap.args.tokenGiveAmount || '0', 'ether'));
                            
                          const quoteAmount = isBuy
                            ? parseFloat(ethers.utils.formatUnits(swap.args.tokenGiveAmount || '0', 'ether'))
                            : parseFloat(ethers.utils.formatUnits(swap.args.tokenGetAmount || '0', 'ether'));
                          
                          const price = quoteAmount / baseAmount;
                          const total = isBuy ? quoteAmount : baseAmount * price;
                          
                          return (
                            <tr key={index}>
                              <td className="text-muted small">
                                <a 
                                  href={`https://etherscan.io/tx/${swap.hash}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-decoration-none"
                                >
                                  {swap.hash?.slice(0, 6) + '...' + (swap.hash?.slice(-4) || '')}
                                </a>
                              </td>
                              <td>
                                <span className={`badge ${isBuy ? 'bg-success' : 'bg-danger'}`}>
                                  {isBuy ? 'Buy' : 'Sell'}
                                </span>
                              </td>
                              <td>{price.toFixed(6)} {quoteSymbol}</td>
                              <td>{baseAmount.toFixed(4)} {baseSymbol}</td>
                              <td>{total.toFixed(4)} {quoteSymbol}</td>
                              <td className="text-muted small">
                                {format(
                                  new Date(Number(swap.args.timestamp?.toString() || '0') * 1000), 
                                  'MMM d, yyyy HH:mm'
                                )}
                              </td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔄</div>
                          <div className="fw-bold mb-1">No Trading History</div>
                          <small className="text-muted">Make your first swap to see transaction history</small>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


Charts.propTypes = {
  // Add any required props here if needed
};

export default Charts;





