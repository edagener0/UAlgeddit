import type { ChangeEvent } from "react"
import "./TextField.css"

export default function TextField({placeholder, name, value, onChange}: {placeholder?: string, name: string, value?: string, onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void})
{
    return (
        <textarea name={name} placeholder={placeholder} value={value} onChange={onChange} className="text-field"></textarea>
    )
}