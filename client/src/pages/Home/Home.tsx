import "./Home.css"
export default function HomePage()
{
    return (
        <div>
            <h1 id="title">UAlgeddit</h1>
            <div className="card-container">
                <div className="home-card">
                    <p>Application developed in <strong>Web Development</strong> at University of Algarve.</p>
                </div>
                <div className="home-card">
                    <p>This app is similar to reddit in many aspects. This app allows users to connect with each other.</p>
                </div>
            </div>
            
        </div>
    )
}