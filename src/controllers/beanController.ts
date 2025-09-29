import { Request, Response } from 'express';
import { BeanModel } from '../models/Bean';
import { CreateBeanRequest, UpdateBeanRequest, ApiResponse } from '../types';

export class BeanController {
  // Create a new bean
  static async createBean(req: Request, res: Response) {
    try {
      const beanData: CreateBeanRequest = req.body;
      
      // Validate required fields
      if (!beanData.user_id || !beanData.name) {
        return res.status(400).json({
          success: false,
          error: 'user_id and name are required'
        } as ApiResponse);
      }

      const bean = await BeanModel.create(beanData);

      res.status(201).json({
        success: true,
        data: bean,
        message: 'Bean created successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error creating bean:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create bean'
      } as ApiResponse);
    }
  }

  // Get bean by ID
  static async getBeanById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const bean = await BeanModel.findById(id);

      if (!bean) {
        return res.status(404).json({
          success: false,
          error: 'Bean not found'
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: bean
      } as ApiResponse);
    } catch (error) {
      console.error('Error fetching bean:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bean'
      } as ApiResponse);
    }
  }

  // Get all beans for a user
  static async getBeansByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const beans = await BeanModel.findByUserId(userId);

      res.json({
        success: true,
        data: beans
      } as ApiResponse);
    } catch (error) {
      console.error('Error fetching beans:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch beans'
      } as ApiResponse);
    }
  }

  // Update bean
  static async updateBean(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates: UpdateBeanRequest = req.body;

      // Check if bean exists
      const existingBean = await BeanModel.findById(id);
      if (!existingBean) {
        return res.status(404).json({
          success: false,
          error: 'Bean not found'
        } as ApiResponse);
      }

      const updatedBean = await BeanModel.update(id, updates);

      res.json({
        success: true,
        data: updatedBean,
        message: 'Bean updated successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error updating bean:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update bean'
      } as ApiResponse);
    }
  }

  // Delete bean
  static async deleteBean(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if bean exists
      const existingBean = await BeanModel.findById(id);
      if (!existingBean) {
        return res.status(404).json({
          success: false,
          error: 'Bean not found'
        } as ApiResponse);
      }

      await BeanModel.delete(id);

      res.json({
        success: true,
        message: 'Bean deleted successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error deleting bean:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete bean'
      } as ApiResponse);
    }
  }

  // Get beans by status
  static async getBeansByStatus(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { status } = req.query;

      if (!status || typeof status !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Status parameter is required'
        } as ApiResponse);
      }

      const beans = await BeanModel.findByStatus(userId, status);

      res.json({
        success: true,
        data: beans
      } as ApiResponse);
    } catch (error) {
      console.error('Error fetching beans by status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch beans by status'
      } as ApiResponse);
    }
  }
}