import React from 'react';
import { navigate } from "astro:transitions/client";
export default function ClickToNavigate({ to, id }) {
    return <button id={id} onClick={() => navigate(to)}>Navigate to `{to}`</button>;
}
