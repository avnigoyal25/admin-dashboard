import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/login.css';

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')

    const navigate = useNavigate()

    const onButtonClick = () => {
        if(email==="admin@gmail.com" && password==="admin@123")
        {
            navigate('/dashboard')
        }
        else{
            setPasswordError("Email or password is wrong! Try again")
        }
    }
    return (
        <div className='mainContainer'>
            <div className={'titleContainer'}>
                <div>Login</div>
            </div>
            <br />
            <div className={'inputContainer'}>
                <input
                    value={email}
                    placeholder="Enter your email here"
                    onChange={(ev) => setEmail(ev.target.value)}
                    className={'inputBox'}
                />
            </div>
            <br />
            <div className={'inputContainer'}>
                <input
                    type='password'
                    value={password}
                    placeholder="Enter your password here"
                    onChange={(ev) => setPassword(ev.target.value)}
                    className={'inputBox'}
                />
                <label className="errorLabel">{passwordError}</label>
            </div>
            <br />
            <div className={'inputContainer'}>
                <input className={'button-7'} type="button" onClick={onButtonClick} value={'Log in'} />
            </div>
        </div>
    )
}
