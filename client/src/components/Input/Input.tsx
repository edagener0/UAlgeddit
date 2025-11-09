import type { ChangeEvent } from "react"
import "./Input.css"
export default function Input({placeholder, type, name, value, onChange}: {placeholder?: string, type?: string, name: string, value?: string, onChange?: (e: ChangeEvent<HTMLInputElement>) => void})
{
    return (
        <input className="default-input" type={type} placeholder={placeholder} name={name} onChange={onChange} value={value}/>
    )
}