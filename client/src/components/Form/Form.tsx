import "./Form.css"

export default function Form({action, method, enctype, children, onSubmit}: {action: string, method: string, enctype?: string, children: React.ReactNode, onSubmit: (e: React.FormEvent<HTMLFormElement>) => void})
{
    return (
        <form action={action} method={method} encType={enctype} onSubmit={onSubmit}>
            {children}
        </form>
    )
}