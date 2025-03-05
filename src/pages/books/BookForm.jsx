import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function BookForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    serial_number: '',
    type: 'book',
    available: true
  });
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchBook();
    }
  }, [id]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setFormData(data);
    } catch (error) {
      toast.error('Error fetching book: ' + error.message);
      navigate('/books');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    }
    
    if (!formData.serial_number.trim()) {
      newErrors.serial_number = 'Serial number is required';
    } else if (!/^[A-Za-z0-9-]+$/.test(formData.serial_number)) {
      newErrors.serial_number = 'Serial number can only contain letters, numbers, and hyphens';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    try {
      setLoading(true);
      let error;

      if (isEditing) {
        ({ error } = await supabase
          .from('books')
          .update(formData)
          .eq('id', id));
      } else {
        ({ error } = await supabase
          .from('books')
          .insert([formData]));
      }

      if (error) throw error;

      toast.success(`Book ${isEditing ? 'updated' : 'added'} successfully`);
      navigate('/books');
    } catch (error) {
      toast.error(`Error ${isEditing ? 'updating' : 'adding'} book: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    validateForm();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
          {isEditing ? 'Edit Book' : 'Add New Book'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Type
            </label>
            <div className="flex gap-4 bg-gray-50 p-3 rounded-md">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="book"
                  checked={formData.type === 'book'}
                  onChange={handleChange}
                  className="form-radio h-5 w-5 text-blue-600"
                />
                <span className="ml-2">Book</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="movie"
                  checked={formData.type === 'movie'}
                  onChange={handleChange}
                  className="form-radio h-5 w-5 text-blue-600"
                />
                <span className="ml-2">Movie</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 
                ${touched.title && errors.title ? 'border-red-500' : ''}`}
              required
            />
            {touched.title && errors.title && (
              <p className="text-red-500 text-xs italic mt-1">{errors.title}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Author <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 
                ${touched.author && errors.author ? 'border-red-500' : ''}`}
              required
            />
            {touched.author && errors.author && (
              <p className="text-red-500 text-xs italic mt-1">{errors.author}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Serial Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 
                  ${touched.serial_number && errors.serial_number ? 'border-red-500' : ''}`}
                placeholder={formData.type === 'book' ? 'BK-001-2023' : 'MV-001-2023'}
                required
              />
              {formData.type === 'book' && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
              {formData.type === 'movie' && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                </div>
              )}
            </div>
            {touched.serial_number && errors.serial_number && (
              <p className="text-red-500 text-xs italic mt-1">{errors.serial_number}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Format: {formData.type === 'book' ? 'BK-XXX-YYYY' : 'MV-XXX-YYYY'} (e.g. {formData.type === 'book' ? 'BK-001-2023' : 'MV-001-2023'})
            </p>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="available"
                checked={formData.available}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2">Available for checkout</span>
            </label>
            <p className="text-gray-500 text-xs mt-1">
              Uncheck this if the book/movie is already loaned out or unavailable
            </p>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/books')}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}