import "./DefaultButton.css"

export default function Button({label, onclick}: {label?: string, onclick?: () => any})
{
    return (
        <button className="default-button" onClick={onclick}>
            {label}
        </button>
    )    
}