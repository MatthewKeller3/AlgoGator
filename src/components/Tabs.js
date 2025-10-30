import Nav from 'react-bootstrap/Nav';
import { LinkContainer } from "react-router-bootstrap";
import './Tabs.css';

const Tabs = () => {
  return (
    <>
      <Nav variant="pills" defaultActiveKey="/" className='justify-content-center my-4 gap-2'>
        <LinkContainer to="/">
          <Nav.Link className="modern-tab">
            <span className="tab-icon">🔄</span>
            <span className="tab-text">Swap</span>
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/deposit">
          <Nav.Link className="modern-tab">
            <span className="tab-icon">💰</span>
            <span className="tab-text">Deposit</span>
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/withdraw">
          <Nav.Link className="modern-tab">
            <span className="tab-icon">💸</span>
            <span className="tab-text">Withdraw</span>
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/charts">
          <Nav.Link className="modern-tab">
            <span className="tab-icon">📊</span>
            <span className="tab-text">Charts</span>
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/aggregator">
          <Nav.Link className="modern-tab aggregator-tab">
            <span className="tab-icon">🎯</span>
            <span className="tab-text">Aggregator</span>
            <span className="badge-pill">Best Rates</span>
          </Nav.Link>
        </LinkContainer>
      </Nav>
    </>
  );
}

export default Tabs;
