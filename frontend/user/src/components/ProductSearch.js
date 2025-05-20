import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa'; // Import search icon

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
  }, [categories, selectedCategories]); // Added 'selectedCategories' to the dependency array

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
    <div className="product-search-container" style={{
      backgroundColor: '#fff', 
      padding: '0', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      border: '1px solid #e0e0e0'
    }}>
      {/* Orange top border - using the site's accent color */}
      <div style={{ height: '4px', backgroundColor: '#D4A96A', width: '100%' }}></div>
      
      {/* Search section */}
      <div style={{ padding: '15px 20px' }}>
        <div className="input-group">
          <div className="position-relative w-100">
            <input
              type="text"
              className="form-control"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={{
                borderRadius: '4px',
                paddingLeft: '40px',
                border: '1px solid #e0e0e0',
                height: '42px'
              }}
            />
            <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>
              <FaSearch />
            </div>
          </div>
        </div>
      </div>
      
      {/* Divider - using a more subtle gold color to match the site's theme */}
      <div style={{ height: '1px', backgroundColor: '#D4A96A', opacity: '0.3', width: '90%', margin: '0 auto' }}></div>
      
      {/* Categories section */}
      <div style={{ padding: '15px 20px' }}>
        {/* All Categories checkbox */}
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="category-all"
            checked={allSelected}
            onChange={handleAllCategoriesChange}
            style={{
              borderColor: allSelected ? '#D4A96A' : '#adb5bd',
              backgroundColor: allSelected ? '#D4A96A' : '#fff',
              outline: 'none'
            }}
          />
          <label className="form-check-label fw-bold" htmlFor="category-all" style={{ marginLeft: '8px' }}>
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
              style={{
                borderColor: selectedCategories[category] ? '#D4A96A' : '#adb5bd',
                backgroundColor: selectedCategories[category] ? '#D4A96A' : '#fff',
                outline: 'none'
              }}
            />
            <label className="form-check-label" htmlFor={`category-${category}`} style={{ marginLeft: '8px' }}>
              {category}
            </label>
          </div>
        ))}
        
        {/* Warning message when no categories selected */}
        {Object.values(selectedCategories).every(v => !v) && (
          <div className="alert alert-warning mt-3 py-2" style={{
            fontSize: '0.9rem',
            backgroundColor: 'rgba(212, 169, 106, 0.1)',
            borderColor: '#D4A96A',
            color: '#856404'
          }}>
            Select at least one category to view products
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSearch;