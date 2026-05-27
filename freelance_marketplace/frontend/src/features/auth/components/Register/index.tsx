import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Step1UserForm } from "./Step1UserForm";
import { Step2RoleEmail } from "./Step2UserForm";
import { Step3Finish } from "./Step3UserForm";
import AuthService from "../../../../services/auth.service";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [roles, setRoles] = useState<string[]>([]);

  const handleRoleChange = (role: string) => {
    setRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };
  const [message, setMessage] = useState<string>("");
  const [verifStatus, setVerifStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [emailVerified, setEmailVerified] = useState<boolean>(false);

  useEffect(() => {
    setEmailVerified(false);
  }, []);

  const handleRegister = (e: React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    
    if (!username || !email || !password) {
      setMessage("Заполните все обязательные поля");
      return;
    }

    if (roles.length === 0) {
      setMessage("Выберите хотя бы одну роль");
      return;
    }

    setMessage("");
    
    AuthService.register(username,email,password,roles)
      .then(()=>{
        setMessage("Регистрация успешна! Перенаправление на страницу входа...");
        setTimeout(() => {
          navigate("/login");
        }, 700);
      })
      .catch((err:any)=>{
        const errorMessage = err.response?.data?.message || err.message || "Ошибка регистрации";
        setMessage(errorMessage);
        console.error("Registration error:", err.response?.data || err);
      });
  };

  return (
    <div className="auth-container">
      {step===1 && <Step1UserForm username={username} setUsername={setUsername} email={email} setEmail={setEmail} password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} message={message} setMessage={setMessage} nextStep={()=>setStep(2)}/>}
      {step===2 && <Step2RoleEmail roles={roles} handleRoleChange={handleRoleChange} email={email} verifStatus={verifStatus} setVerifStatus={setVerifStatus} message={message} setMessage={setMessage} nextStep={()=>setStep(3)} prevStep={()=>setStep(1)} emailVerified={emailVerified} setEmailVerified={setEmailVerified}/>}
      {step===3 && <Step3Finish emailVerified={emailVerified} handleRegister={handleRegister} prevStep={()=>setStep(2)} message={message}/>}
    </div>
  );
};

export default Register;