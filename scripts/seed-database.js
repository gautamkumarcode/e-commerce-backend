import dotenv from "dotenv";
import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

dotenv.config();

// Database connection
const connectDB = async () => {
	try {
		await mongoose.connect(process.env.DATABASE_URL);
		console.log("MongoDB connected...");
	} catch (err) {
		console.error("Database connection error:", err.message);
		process.exit(1);
	}
};

// Create admin user
const createAdminUser = async () => {
	try {
		const adminData = {
			name: "Admin User",
			email: "admin@example.com",
			password: "admin123",
			role: "admin",
			isEmailVerified: true,
			isVerified: true,
		};

		const existingAdmin = await User.findOne({ email: adminData.email });
		if (existingAdmin) {
			console.log("Admin user already exists");
			return existingAdmin;
		}

		const admin = new User(adminData);
		await admin.save();
		console.log("Admin user created successfully");
		return admin;
	} catch (error) {
		console.error("Error creating admin user:", error.message);
		throw error;
	}
};

// Seed brands
const seedBrands = async () => {
	try {
		const brands = [
			{
				name: "Apple",
				description: "Technology company specializing in consumer electronics",
				logo: "apple-logo.jpg",
				website: "https://www.apple.com",
				featured: true,
			},
			{
				name: "Samsung",
				description: "South Korean multinational electronics corporation",
				logo: "samsung-logo.jpg",
				website: "https://www.samsung.com",
				featured: true,
			},
			{
				name: "FashionCo",
				description: "Premium clothing brand",
				logo: "fashionco-logo.jpg",
				website: "https://www.fashionco.com",
			},
			{
				name: "KitchenMaster",
				description: "Innovative kitchen appliances",
				logo: "kitchenmaster-logo.jpg",
				website: "https://www.kitchenmaster.com",
			},
		];

		// Save brands one by one to ensure proper slug generation
		const createdBrands = [];
		for (const brandData of brands) {
			const brand = new Brand(brandData);
			await brand.save();
			createdBrands.push(brand);
			console.log(`Created brand: ${brand.name}`);
		}

		console.log("Brands seeded successfully");
		return createdBrands;
	} catch (error) {
		console.error("Error seeding brands:", error.message);
		throw error;
	}
};

// Seed categories
const seedCategories = async () => {
	try {
		// First create parent categories one by one to ensure slugs are generated
		const parentCategories = [];

		const electronicsCategory = new Category({
			name: "Electronics",
			description: "All electronic devices and accessories",
			image: "electronics.jpg",
		});
		await electronicsCategory.save();
		parentCategories.push(electronicsCategory);

		const clothingCategory = new Category({
			name: "Clothing",
			description: "Men, women and kids clothing",
			image: "clothing.jpg",
		});
		await clothingCategory.save();
		parentCategories.push(clothingCategory);

		const homeCategory = new Category({
			name: "Home & Kitchen",
			description: "Home appliances and kitchenware",
			image: "home-kitchen.jpg",
		});
		await homeCategory.save();
		parentCategories.push(homeCategory);

		console.log("Parent categories seeded");

		// Now create child categories with proper parent references
		const childCategories = [];

		const smartphonesCategory = new Category({
			name: "Smartphones",
			description: "Latest smartphones and accessories",
			parent: electronicsCategory._id,
			image: "smartphones.jpg",
		});
		await smartphonesCategory.save();
		childCategories.push(smartphonesCategory);

		const laptopsCategory = new Category({
			name: "Laptops",
			description: "Laptops and notebooks",
			parent: electronicsCategory._id,
			image: "laptops.jpg",
		});
		await laptopsCategory.save();
		childCategories.push(laptopsCategory);

		console.log("Child categories seeded");

		return [...parentCategories, ...childCategories];
	} catch (error) {
		console.error("Error seeding categories:", error.message);
		throw error;
	}
};

// Seed products with brand references
const seedProducts = async (categories, brands) => {
	try {
		// Find all needed references
		const smartphonesCategory = categories.find(
			(c) => c.name === "Smartphones"
		);
		const laptopsCategory = categories.find((c) => c.name === "Laptops");
		const clothingCategory = categories.find((c) => c.name === "Clothing");
		const homeCategory = categories.find((c) => c.name === "Home & Kitchen");

		const appleBrand = brands.find((b) => b.name === "Apple");
		const samsungBrand = brands.find((b) => b.name === "Samsung");
		const fashionCoBrand = brands.find((b) => b.name === "FashionCo");
		const kitchenMasterBrand = brands.find((b) => b.name === "KitchenMaster");

		const products = [
			{
				name: "iPhone 15 Pro",
				description: "Latest iPhone with A16 Bionic chip",
				price: 999,
				comparePrice: 1099,
				category: smartphonesCategory._id,
				brand: appleBrand._id,
				sku: "IPH15PRO256",
				images: [
					{
						url: "iphone15pro.jpg",
						alt: "iPhone 15 Pro",
						isMain: true,
					},
				],
				inventory: {
					quantity: 100,
					lowStockThreshold: 10,
					trackQuantity: true,
				},
				specifications: [
					{ name: "Processor", value: "A16 Bionic" },
					{ name: "Storage", value: "256GB" },
				],
				tags: ["smartphone", "apple", "iphone"],
				weight: 0.2,
				dimensions: {
					length: 5.78,
					width: 2.82,
					height: 0.32,
				},
				isFeatured: true,
			},
			{
				name: 'MacBook Pro 16"',
				description: "Powerful laptop for professionals",
				price: 2499,
				comparePrice: 2699,
				category: laptopsCategory._id,
				brand: appleBrand._id,
				sku: "MBP16M1MAX",
				images: [
					{
						url: "macbookpro16.jpg",
						alt: 'MacBook Pro 16"',
						isMain: true,
					},
				],
				inventory: {
					quantity: 50,
					lowStockThreshold: 5,
					trackQuantity: true,
				},
				specifications: [
					{ name: "Processor", value: "M1 Max" },
					{ name: "RAM", value: "32GB" },
					{ name: "Storage", value: "1TB SSD" },
				],
				tags: ["laptop", "apple", "macbook"],
				weight: 2.1,
				dimensions: {
					length: 14.0,
					width: 9.8,
					height: 0.6,
				},
				isFeatured: true,
			},
			{
				name: "Samsung Galaxy S23",
				description: "Flagship Android smartphone",
				price: 799,
				comparePrice: 899,
				category: smartphonesCategory._id,
				brand: samsungBrand._id,
				sku: "SGS23BLK256",
				images: [
					{
						url: "galaxys23.jpg",
						alt: "Samsung Galaxy S23",
						isMain: true,
					},
				],
				inventory: {
					quantity: 75,
					lowStockThreshold: 10,
					trackQuantity: true,
				},
				specifications: [
					{ name: "Processor", value: "Snapdragon 8 Gen 2" },
					{ name: "Storage", value: "256GB" },
				],
				tags: ["smartphone", "samsung", "android"],
				weight: 0.19,
				dimensions: {
					length: 5.76,
					width: 2.79,
					height: 0.3,
				},
			},
			{
				name: "Cotton T-Shirt",
				description: "Premium quality cotton t-shirt",
				price: 29.99,
				comparePrice: 39.99,
				category: clothingCategory._id,
				brand: fashionCoBrand._id,
				sku: "CTSHIRTWHM",
				images: [
					{
						url: "tshirt.jpg",
						alt: "Cotton T-Shirt",
						isMain: true,
					},
				],
				inventory: {
					quantity: 200,
					lowStockThreshold: 20,
					trackQuantity: true,
				},
				specifications: [
					{ name: "Material", value: "100% Cotton" },
					{ name: "Size", value: "Medium" },
				],
				tags: ["clothing", "tshirt", "cotton"],
				weight: 0.15,
			},
			{
				name: "Air Fryer",
				description: "5L capacity digital air fryer",
				price: 129.99,
				comparePrice: 149.99,
				category: homeCategory._id,
				brand: kitchenMasterBrand._id,
				sku: "KMAF5LDIG",
				images: [
					{
						url: "airfryer.jpg",
						alt: "Air Fryer",
						isMain: true,
					},
				],
				inventory: {
					quantity: 80,
					lowStockThreshold: 10,
					trackQuantity: true,
				},
				specifications: [
					{ name: "Capacity", value: "5L" },
					{ name: "Power", value: "1500W" },
				],
				tags: ["kitchen", "appliance", "airfryer"],
				weight: 5.2,
				dimensions: {
					length: 14.0,
					width: 12.0,
					height: 12.0,
				},
				isFeatured: true,
			},
		];

		console.log(typeof products);
		for (const productData of products) {
			const product = new Product(productData);
			await product.save();
			console.log(`Created product: ${product.name}`);
		}

		console.log("Products seeded successfully");
	} catch (error) {
		console.error("Error seeding products:", error.message);
		throw error;
	}
};

// Main seeding function
const seedDatabase = async () => {
	try {
		await connectDB();

		// Clear existing data (optional - be careful in production)
		await User.deleteMany({});
		await Brand.deleteMany({});
		await Category.deleteMany({});
		await Product.deleteMany({});

		const admin = await createAdminUser();
		const brands = await seedBrands();
		const categories = await seedCategories();
		await seedProducts(categories, brands);

		console.log("Database seeding completed successfully");
		process.exit(0);
	} catch (error) {
		console.error("Database seeding failed:", error.message);
		process.exit(1);
	}
};

// Execute the seeding
seedDatabase();

// Run this after seedDatabase
const sample = await Product.find().limit(1).populate("category brand").lean();
console.log(JSON.stringify(sample, null, 2));
