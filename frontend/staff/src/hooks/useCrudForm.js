import { useState, useCallback } from 'react';

/**
 * useCrudForm — manages form state, validation, and submission for CRUD pages
 *
 * @param {Object} initialValues - Initial form field values
 * @param {Object} validationRules - { fieldName: (value, allValues) => errorMsg | null }
 * @param {Function} onSubmit - async (formData, isEditing) => void
 * @returns {{
 *   formData, formErrors, isSubmitting, isEditing,
 *   setFormData, handleChange, handleSubmit,
 *   startEdit, resetForm, setFormErrors
 * }}
 */
const useCrudForm = (initialValues = {}, validationRules = {}, onSubmit) => {
  const [formData, setFormData] = useState(initialValues);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Generic change handler for <input>, <select>, <textarea>
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for that field on change
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [formErrors]);

  /**
   * Validate all fields and return errors object
   */
  const validate = useCallback(
    (data) => {
      const errors = {};
      Object.entries(validationRules).forEach(([field, ruleFn]) => {
        const error = ruleFn(data[field], data);
        if (error) errors[field] = error;
      });
      return errors;
    },
    [validationRules]
  );

  /**
   * Handle form submission — validates then calls onSubmit
   * @param {React.FormEvent} [e]
   */
  const handleSubmit = useCallback(
    async (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const errors = validate(formData);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      setIsSubmitting(true);
      try {
        await onSubmit(formData, isEditing);
      } catch (err) {
        console.error('Form submission error:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, isEditing, onSubmit, validate]
  );

  /**
   * Populate form with existing data for editing
   * @param {Object} data - Existing entity data
   */
  const startEdit = useCallback((data) => {
    setFormData({ ...initialValues, ...data });
    setFormErrors({});
    setIsEditing(true);
  }, [initialValues]);

  /**
   * Reset form to initial values (used after save or close)
   */
  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setFormErrors({});
    setIsEditing(false);
  }, [initialValues]);

  return {
    formData,
    formErrors,
    isSubmitting,
    isEditing,
    setFormData,
    setFormErrors,
    handleChange,
    handleSubmit,
    startEdit,
    resetForm,
    validate,
  };
};

export default useCrudForm;
