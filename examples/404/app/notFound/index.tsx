import './style.scss'

const NotFound: React.FC = () => {
  return (
    <div className="not-found-container">
      <div className="error-code">404</div>
      <div className="error-message">Oops! Page not found.</div>
      <div className="back-link">
        <a href="/home">Back to Home</a>
      </div>
    </div>
  )
}

export default NotFound
