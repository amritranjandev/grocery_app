import { createContext, use, useEffect } from "react";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import { toast } from "react-hot-toast";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

  const currency = import.meta.env.VITE_CURRENCY;

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [searchQuery, setSearchQuery] = useState({});


  // fetch seller status
  const fetchSeller = async () => {
    try {
      const { data } = await axios.get("/api/seller/is-auth");
      if (data.success) {
        setIsSeller(true);
      } else {
        setIsSeller(false);
      }
    } catch (error) {
      // toast.error(error.message);
      setIsSeller(false);
    }
  }

  // fetch user auth status, cart items
  const fetchUser = async ()=>{
    try{
      const {data} = await axios.get('/api/user/is-auth');
      if(data.success){
        setUser(data.user)
        setCartItems(data.user.cartItems)
      }
    }catch(error){
      setUser(null)
    }
  }

  // Fetch products from the server (dummy data for now)
  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/api/product/list");
      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message)
        // setProducts(dummyProducts);
      }
    }
    catch (error) {
      console.error("Error fetching products:", error);
      // setProducts(dummyProducts);
      toast.error(error.message)
    }
  };

  //  add product to cart
  const addToCart = (itemId) => {
    let cartData = structuredClone(cartItems);

    if(cartData[itemId]){
      cartData[itemId] +=1;
    }else{
      cartData[itemId] = 1;
    }
    setCartItems(cartData);
    toast.success("Added to cart")
  };

  // update cart items
  const updateCartItem = (itemId, quantity) => {
    let cartData = structuredClone(cartItems);
    cartData[itemId] = quantity;

    setCartItems(cartData);
    toast.success("Cart updated")
  };

  // remove item from cart
  const removeFromCart = (itemId) => {
    let cartData = structuredClone(cartItems);
    if(cartData[itemId] ){
      cartData[itemId] -=1;
        if(cartData[itemId] === 0){
          delete cartData[itemId];
        }
    }
    setCartItems(cartData);
    toast.success("Item removed from cart")
  };

  // get cart items count
  const getCartCount = () => {
    let count = 0;
    for (const key in cartItems) {
      count += cartItems[key];
    }
    return count;
  };

  // get cart total price
  const getCartAmount = () => {
    let total = 0;
    for (const key in cartItems) {
      const product = products.find((item) => item._id === key);
      if (product) {
        total += product.offerPrice * cartItems[key];
      }
    }
    return Math.floor(total *100) / 100;
  };

  useEffect(() => {
    fetchUser();
    fetchSeller();
    fetchProducts();
  }, []);


  // update db cart items
  useEffect(()=>{
    const updateCart = async ()=>{
      try{
        const {data} = await axios.post('/api/cart/update', {cartItems})
        if(!data.success){
          toast.error(data.message)
        }
      }catch(error){
        console.error(error)
        toast.error(error.message)
      }
    }

    if(user){
      updateCart()
    }
  }, [cartItems])

  const value = {
    navigate,
    user,
    setUser,
    isSeller,
    setIsSeller,
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
    getCartCount,
    getCartAmount,
    axios,
    fetchProducts,
    setCartItems,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  return useContext(AppContext);
};
