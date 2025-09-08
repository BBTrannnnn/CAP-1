import Crop from "../models/Crop.js";
import asyncHandler from "express-async-handler";

const createCrop = asyncHandler(async (req, res) => {
    const { name, species, category, plantingDate, location, harvestDate, status, notes } = req.body;
    const crop = await Crop.create({
        name,
        species,
        category,
        plantingDate,
        location,
        harvestDate,
        status,
        notes
    });
    res.status(201).json({
        success: true,
        message: 'Crop created successfully',
        data: {
            crop: {
                id: crop._id,
                name: crop.name,
                species: crop.species,
                category: crop.category,
                plantingDate: crop.plantingDate,
                location: crop.location,
                harvestDate: crop.harvestDate,
                status: crop.status,
                notes: crop.notes,
                createdAt: crop.createdAt,
                updatedAt: crop.updatedAt
            }
        }
    });
});

const getAllCrops = asyncHandler(async (_req, res) => {
    const crops = await Crop.find();
    res.status(200).json({
        success: true,
        message: 'Get all crops successfully',
        data: crops
    });
});

const updateCropById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, species, category, plantingDate, location, harvestDate, status, notes } = req.body;
    const crop = await Crop.findByIdAndUpdate(id, {
        name,
        species,    
        category,
        plantingDate,
        location,
        harvestDate,
        status,
        notes
    }, { new: true });
    if (!crop) {
        res.status(404);
        throw new Error('Crop not found');
    }
    res.status(200).json({
        success: true,
        message: 'Crop updated successfully',   
        data: {
            crop: {
                id: crop._id,
                name: crop.name,
                species: crop.species,
                category: crop.category,
                plantingDate: crop.plantingDate,    
                location: crop.location,
                harvestDate: crop.harvestDate,
                status: crop.status,
                notes: crop.notes,
                createdAt: crop.createdAt,
                updatedAt: crop.updatedAt
            }
        }
    });
});

const deleteCropById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const crop = await Crop.findByIdAndDelete(id);
    if (!crop) {
        res.status(404);
        throw new Error('Crop not found');
    }
    res.status(200).json({
        success: true,
        message: 'Crop deleted successfully',
        data: null
    });
});

export { createCrop, getAllCrops , deleteCropById, updateCropById };
