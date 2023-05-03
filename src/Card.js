import React, { useState } from "react";

export default function Card({title, info}) {
    return (
    <div className="card">
        <div className="container">
            <p className="title">{title}</p>
            <div className="divider"></div>
            <p>{info}</p>
        </div>
    </div>
    );
}