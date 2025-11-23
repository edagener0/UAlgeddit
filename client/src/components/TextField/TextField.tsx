import type { ChangeEvent } from "react"
import "./TextField.css"

export default function TextField({placeholder, name, value, onChange, onKeyDown}: {placeholder?: string, name: string, value?: string, onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void, onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void})
{
    return (
        <textarea name={name} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown} className="text-field"></textarea>
    )
}