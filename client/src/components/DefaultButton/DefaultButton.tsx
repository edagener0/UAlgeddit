import "./DefaultButton.css"

export default function Button({label, onclick, type}: {label?: string, onclick?: () => any, type?: string})
{
    return (
        <button className="default-button" onClick={onclick}>
            {label}
        </button>
    )    
}