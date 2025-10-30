import { Alert, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const EmptyPoolWarning = ({ poolName }) => {
  return (
    <Alert variant="warning" className="mb-3">
      <Alert.Heading>⚠️ Pool is Empty!</Alert.Heading>
      <p>
        The <strong>{poolName}</strong> pool doesn't have any liquidity yet. 
        You need to add liquidity before you can swap tokens.
      </p>
      <hr />
      <div className="d-flex justify-content-between align-items-center">
        <span className="text-muted">Add liquidity to enable swapping →</span>
        <Link to="/deposit">
          <Button variant="primary" size="sm">
            Go to Deposit
          </Button>
        </Link>
      </div>
    </Alert>
  )
}

export default EmptyPoolWarning
