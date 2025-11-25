import { useEffect, useState } from "react";
import SubgedditCard from "../../../components/SubgedditCard/SubgedditCard"
import "./SubgedditsList.css"
import { SUBGEDDIT_LIST } from "../../../utils/Constants";
import type SubgedditInterface from "./SubgedditListInterface";
import { Link } from "react-router-dom";
import Button from "../../../components/DefaultButton/DefaultButton";

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

    useEffect(() => {
        fetchSubgeddits();
    }, [])

    return (
        <div>
            <div id="subgeddits-container">
                {subgeddits.map((subgeddit, index) => {
                    return <SubgedditCard subgeddit={subgeddit} currentUserID={currentUserID} key={index}/>
                })}
                
            </div>
        </div>
    )
}