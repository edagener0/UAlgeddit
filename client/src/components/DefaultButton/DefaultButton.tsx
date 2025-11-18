import "./DefaultButton.css"

export default function Button({label, onclick, type, id}: {label?: string, onclick?: () => any, type?: string, id?: string})
{
    return (
        <button className="default-button" onClick={onclick} id={id}>
            {label}
        </button>
    )    
}