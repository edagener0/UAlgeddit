import "./Form.css"

export default function Form({id, action, method, enctype, children, onSubmit}: {id?: string, action?: string, method?: string, enctype?: string, children: React.ReactNode, onSubmit: (e: React.FormEvent<HTMLFormElement>) => void})
{
    return (
        <form id={id} action={action} method={method} encType={enctype} onSubmit={onSubmit}>
            {children}
        </form>
    )
}