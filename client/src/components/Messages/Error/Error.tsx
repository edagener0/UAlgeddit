import "./Error.css"

export default function Error({error}: {error: string | null})
{
    return (
        <>
            {error && <div className="error-message">{error}</div>}
        </>
    )
}