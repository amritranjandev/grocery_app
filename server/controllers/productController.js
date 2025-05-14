import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";





// addProduct: /api/product/add
export const addProduct = async (req, res) => {
    try {
        let productData = JSON.parse(req.body.productData);
        const images = req.files
        const imagesUrl = await Promise.all(
            images.map(async (image) => {
                console.log("Uploading image:", image.path);
                let result = await cloudinary.uploader.upload(image.path, {
                    resource_type: "image"
                });
                return result.secure_url;
            })
        )

        await Product.create({
            ...productData,
            image: imagesUrl,
        })
        return res.status(201).json({ success: true, message: "Product added successfully" });
    } catch (error) {
        console.error("Error uploading images:", error);
        return res.status(500).json({ success: false, message: "Image upload failed" });
    }


}

// get product: /api/product/list
export const productList = async (req, res) => {
    try {
        const products = await Product.find({});
        return res.status(200).json({ success: true, products });
    } catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
}

// get product by id: /api/product/id
export const productById = async (req, res) => {
    try {
        const { id } = req.body;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        return res.status(200).json({ success: true, product });
    } catch (error) {
        console.error("Error fetching product by ID:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch product" });
    }
}

//  change product inStock: /api/product/stock
export const changeStock = async (req, res) => {
    try {
        const { id, inStock } = req.body;
        await Product.findByIdAndUpdate(id, { inStock });
        return res.status(200).json({ success: true, message: "Product stock updated successfully" });
    } catch (error) {
        console.error("Error updating product stock:", error);
        return res.status(500).json({ success: false, message: "Failed to update product stock" });
    }

}