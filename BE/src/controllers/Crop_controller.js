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

export { createCrop, getAllCrops };
