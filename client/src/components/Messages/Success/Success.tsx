import "./Success.css"

export default function Success({success}: {success: string | null})
{
    return (
        <>
            {success && <div className="success-message">{success}</div>}
        </>
    )
}