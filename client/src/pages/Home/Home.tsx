import "./Home.css"
export default function HomePage()
{
    return (
        <div>
            <h1 id="title">UAlgeddit</h1>
            <div className="card-container">
                <div className="home-card">
                    <p>Aplicação desenvolvida no âmbito de <strong>Desenvolvimento de Aplicações para a Web</strong> na Universidade do Algarve</p>
                </div>
                <div className="home-card">
                    <p>Esta aplicação é muito semelhante ao Reddit em vários aspetos. Esta aplicação permite os utilizadores conectarem-se entre si.</p>
                </div>
            </div>
            
        </div>
    )
}