import React, { useState, useEffect } from 'react';

const ProductSearch = ({ 
  categories, 
  onSearch, 
  onCategoryFilter 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState({});
  const [allSelected, setAllSelected] = useState(true);
  
  // Initialize selected categories only once when categories are first loaded
  useEffect(() => {
    if (categories && categories.length && Object.keys(selectedCategories).length === 0) {
      const initialCategoryState = categories.reduce((acc, category) => {
        acc[category] = true; // All categories selected by default
        return acc;
      }, {});
      setSelectedCategories(initialCategoryState);
    }
  }, [categories]); // Dependencies - only when categories change

  // Update the "All" checkbox state based on individual checkboxes
  useEffect(() => {
    if (categories && categories.length && Object.keys(selectedCategories).length) {
      const allCategoriesSelected = categories.every(cat => selectedCategories[cat]);
      setAllSelected(allCategoriesSelected);
    }
  }, [categories, selectedCategories]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleCategoryChange = (category) => {
    // Important: Create a completely new object for React to detect the change
    const updatedCategories = {...selectedCategories};
    updatedCategories[category] = !updatedCategories[category];
    
    // Update state first
    setSelectedCategories(updatedCategories);
    
    // Then notify parent with filtered categories
    const activeCategories = Object.keys(updatedCategories)
      .filter(key => updatedCategories[key] === true);
    
    onCategoryFilter(activeCategories);
  };

  const handleAllCategoriesChange = () => {
    const newAllSelectedState = !allSelected;
    
    // Create a new object with updated values for all categories
    const updatedCategories = {};
    categories.forEach(category => {
      updatedCategories[category] = newAllSelectedState;
    });
    
    // Update state
    setSelectedCategories(updatedCategories);
    setAllSelected(newAllSelectedState);
    
    // Notify parent
    const activeCategories = newAllSelectedState ? [...categories] : [];
    onCategoryFilter(activeCategories);
  };

  return (
    <div className="product-search-container" style={{backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
      <div className="mb-4">
        <h4 className="mb-3">Search Products</h4>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="mb-3">Filter by Category</h4>
        
        {/* All Categories checkbox */}
        <div className="form-check mb-3 border-bottom pb-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="category-all"
            checked={allSelected}
            onChange={handleAllCategoriesChange}
          />
          <label className="form-check-label fw-bold" htmlFor="category-all">
            All Categories
          </label>
        </div>
        
        {/* Individual category checkboxes */}
        {categories && categories.map((category) => (
          <div className="form-check mb-2" key={category}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`category-${category}`}
              checked={Boolean(selectedCategories[category])}
              onChange={() => handleCategoryChange(category)}
            />
            <label className="form-check-label" htmlFor={`category-${category}`}>
              {category}
            </label>
          </div>
        ))}
        
        {/* Warning message when no categories selected */}
        {Object.values(selectedCategories).every(v => !v) && (
          <div className="alert alert-warning mt-3 py-2" style={{fontSize: '0.9rem'}}>
            Select at least one category to view products
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSearch;