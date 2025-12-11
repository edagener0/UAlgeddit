import { useEffect, useState } from "react";
import SubgedditCard from "../../../components/SubgedditCard/SubgedditCard"
import "./SubgedditsList.css"
import { SUBGEDDIT_DELETE, SUBGEDDIT_LIST } from "../../../utils/Constants";
import type SubgedditInterface from "./SubgedditListInterface";

export default function SubgedditsList({token, currentUserID}: {token: string | null, currentUserID: number | null})
{
const [subgeddits, setSubgeddits] = useState<SubgedditInterface[]>([]);

    const fetchSubgeddits = async () => {
        
        const response = await fetch(`${SUBGEDDIT_LIST}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            }
        )

        const data = await response.json();
        setSubgeddits(data);
    }

    const handleDeleteSubgeddit = async (id: number) => {
        const response = await fetch(`${SUBGEDDIT_DELETE}/${id}`, {   
            method: "POST",                                       
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
            });

            if (response.ok) 
            {
                setSubgeddits(prev => prev.filter(s => s.subgeddit_id !== id));
            }
    };

    useEffect(() => {
        fetchSubgeddits();
    }, [])

    return (
        <div>
            <div id="subgeddits-container">
                {subgeddits.map((subgeddit, index) => {
                    return <SubgedditCard subgeddit={subgeddit} currentUserID={currentUserID} onDelete={handleDeleteSubgeddit} key={index}/>
                })}
                
            </div>
        </div>
    )
}