import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";
import axios from "axios";
 
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY;

  const navigate = useNavigate();
  const [user, setUser] = useState(null)
  const [isSeller, setIsSeller] = useState(false)
  const [showUserLogin, setShowUserLogin] = useState(false)
  const [products, setproducts] = useState([])

  const [cartItems, setCartItems] = useState({})
  const [searchQuery, setSearchQuery] = useState({})

  //fetch  Seller status

  const fetchSeller = async ()=>{
    try {
      const { data } = await axios.get('/api/seller/is-auth');
      if (data.success) {
        setIsSeller(true);
      } else {
        setIsSeller(false);
      }
    } catch (error) {
      setIsSeller(false);
    }
  }

  // fetch user status , User Data and Cart Items
  const fetchUser = async ()=>{
    try {
      const { data } = await axios.get('/api/user/is-auth');
      if (data.success) {
        setUser(data.user)
        setCartItems(data.user.cartItems)
      }
    } catch (error) {
      setUser(null)
    
    
    }
  }

  // fetch All products

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/api/product/list");
      // const { data } = await axios.post("/api/product/list");
      if (data.success) {
        setproducts(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const addToCart = (itemId) => {
    let cartData = structuredClone(cartItems);

    if (cartData[itemId]) {
      cartData[itemId] += 1;
    } else {
      cartData[itemId] = 1;
    }
    setCartItems(cartData);
    toast.success("Added to Cart");
  };

  const updateCartItem = (itemId, quatity) => {
    let cartData = structuredClone(cartItems);
    cartData[itemId] = quatity;
    setCartItems(cartData);
    toast.success("Cart Updated");
  };

  const removeFromCart = (itemId) => {
    let cartData = structuredClone(cartItems);
    if (cartData[itemId]) {
      cartData[itemId] -= 1;
      if (cartData[itemId] == 0) {
        delete cartData[itemId];
      }
    }
    toast.success(" Removeed from Cart");
    setCartItems(cartData);
  };

  // get cart item count
  const getCartCount = () => {
    let totalCount = 0;
    for (const item in cartItems) {
      totalCount += cartItems[item];
    }
    return totalCount;
  };
  //Get cart total ammount
  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      if (cartItems[items] > 0) {
        totalAmount += itemInfo.offerPrice * cartItems[items];
      }
    }
    return Math.floor(totalAmount * 100) / 100;
  }

    useEffect(()=>{
    fetchUser()
    fetchSeller()
    fetchProducts()
  },[])

  // update Database Cart Items

  useEffect(()=>{
    const updateCart = async () => {
      try {
        const { data } = await axios.post('/api/cart/update', {cartItems})
        if (!data.success) {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    }
    if(user) {
      updateCart()
    }
  },[cartItems])

  const value = {
    navigate,
    user,
    setUser,
    setIsSeller,
    isSeller,
    showUserLogin,
    setShowUserLogin,
    products,
    currency,
    addToCart,
    updateCartItem,
    removeFromCart,
    cartItems,
    searchQuery,
    setSearchQuery,
    getCartAmount,
    getCartCount,
    axios,
    fetchProducts,
    setCartItems
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  return useContext(AppContext);
};
