import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { CustomCard, CustomCardHeader, CustomCardBody } from '@/components/ui/custom-card';
import { Form, FormGroup, FormLabel, FormInput } from '@/components/ui/custom-form';
import { CustomButton } from '@/components/ui/custom-button';
import { User, Lock } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    password: '',
    role: 'user'

  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        navigate('/login');
      } else {
        const data = await response.json();
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      alert('An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showNavbar={false} showFooter={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <CustomCard>
            <CustomCardHeader>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Register for ML Pipeline
                </h1>
                <p className="text-gray-300">
                  Create your account to start building ML projects
                </p>
              </div>
            </CustomCardHeader>
            <CustomCardBody>
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <FormLabel htmlFor="fullname" className='text-slate-950'>Full Name</FormLabel>
                  <div className="relative">
                    <FormInput
                      type="text"
                      id="fullname"
                      name="fullname"
                      placeholder="Enter your full name"
                      value={formData.fullname}
                      onChange={handleInputChange}
                      required
                      className="pl-12 text-slate-950"
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="username" className="text-slate-950">Username</FormLabel>
                  <div className="relative">
                    <FormInput
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      className="pl-12  text-slate-950"
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="password" className="text-slate-950">Password</FormLabel>
                  <div className="relative">
                    <FormInput
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="pl-12  text-slate-950"
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </FormGroup>
                <CustomButton
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Registering...' : 'Register'}
                </CustomButton>
                <div className="text-center mt-6">
                  <p className="text-gray-300">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
                    >
                      Login
                    </Link>
                  </p>
                </div>
              </Form>
            </CustomCardBody>
          </CustomCard>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
