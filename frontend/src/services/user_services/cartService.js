/**
 * Service quản lý giỏ hàng trong localStorage
 */

// Key lưu giỏ hàng trong localStorage
const CART_STORAGE_KEY = 'cart';

/**
 * Lấy nội dung giỏ hàng từ localStorage
 * @returns {Array} - Mảng các item trong giỏ hàng
 */
export const getCart = () => {
  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    if (cartData) {
      return JSON.parse(cartData);
    }
    return [];
  } catch (error) {
    console.error('Error retrieving cart from localStorage:', error);
    return [];
  }
};

/**
 * Lưu giỏ hàng vào localStorage
 * @param {Array} cartItems - Mảng các item trong giỏ hàng
 */
export const saveCart = (cartItems) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    return true;
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
    return false;
  }
};

/**
 * Xóa giỏ hàng khỏi localStorage
 */
export const clearCart = () => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing cart from localStorage:', error);
    return false;
  }
};

/**
 * Thêm sản phẩm vào giỏ hàng
 * @param {Object} product - Sản phẩm cần thêm vào giỏ
 * @param {Array} currentCart - Giỏ hàng hiện tại (không bắt buộc)
 * @returns {Array} - Giỏ hàng mới
 */
export const addToCart = (product, currentCart = null) => {
  try {
    // Nếu không có currentCart, lấy từ localStorage
    const cart = currentCart || getCart();
    
    // Kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng chưa
    const existingItemIndex = cart.findIndex(item => item.product._id === product._id);
    
    let newCart;
    if (existingItemIndex >= 0) {
      // Nếu sản phẩm đã tồn tại, tăng số lượng
      newCart = [...cart];
      newCart[existingItemIndex] = {
        ...newCart[existingItemIndex],
        quantity: newCart[existingItemIndex].quantity + 1
      };
    } else {
      // Nếu là sản phẩm mới, thêm vào giỏ
      newCart = [...cart, { product, quantity: 1 }];
    }
    
    // Lưu giỏ hàng mới vào localStorage
    saveCart(newCart);
    
    return newCart;
  } catch (error) {
    console.error('Error adding product to cart:', error);
    return currentCart || getCart();
  }
};

/**
 * Xóa sản phẩm khỏi giỏ hàng
 * @param {string} productId - ID của sản phẩm cần xóa
 * @param {Array} currentCart - Giỏ hàng hiện tại (không bắt buộc)
 * @returns {Array} - Giỏ hàng mới
 */
export const removeFromCart = (productId, currentCart = null) => {
  try {
    // Nếu không có currentCart, lấy từ localStorage
    const cart = currentCart || getCart();
    
    // Lọc bỏ sản phẩm cần xóa
    const newCart = cart.filter(item => item.product._id !== productId);
    
    // Lưu giỏ hàng mới vào localStorage
    saveCart(newCart);
    
    return newCart;
  } catch (error) {
    console.error('Error removing product from cart:', error);
    return currentCart || getCart();
  }
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ hàng
 * @param {string} productId - ID của sản phẩm cần cập nhật
 * @param {number} quantity - Số lượng mới
 * @param {Array} currentCart - Giỏ hàng hiện tại (không bắt buộc)
 * @returns {Array} - Giỏ hàng mới
 */
export const updateQuantity = (productId, quantity, currentCart = null) => {
  try {
    if (quantity < 1) return currentCart || getCart();
    
    // Nếu không có currentCart, lấy từ localStorage
    const cart = currentCart || getCart();
    
    // Cập nhật số lượng cho sản phẩm có id tương ứng
    const newCart = cart.map(item => 
      item.product._id === productId 
        ? { ...item, quantity } 
        : item
    );
    
    // Lưu giỏ hàng mới vào localStorage
    saveCart(newCart);
    
    return newCart;
  } catch (error) {
    console.error('Error updating product quantity in cart:', error);
    return currentCart || getCart();
  }
};

/**
 * Service object containing all cart management functions
 */
const cartService = {
  getCart,
  saveCart,
  clearCart,
  addToCart,
  removeFromCart,
  updateQuantity
};

export default cartService;