import { Response } from 'express';
import { Op } from 'sequelize';
import { User, Employee } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../utils/helpers';
import { Validator } from '../utils/validator';
import { Sanitizer } from '../utils/sanitizer';

export class UserController {
  async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user!.role;
      
      // Only coordinators and admins can list users
      if (userRole === 'employee') {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const filters = Validator.sanitizeAndValidateFilters(req.query);
      
      const whereConditions: any = {};
      
      if (filters.search) {
        whereConditions[Op.or] = [
          { login: { [Op.iLike]: `%${filters.search}%` } },
          { full_name: { [Op.iLike]: `%${filters.search}%` } },
          { email: { [Op.iLike]: `%${filters.search}%` } }
        ];
      }

      // Role-based filtering for coordinators
      if (userRole === 'coordinator') {
        whereConditions.role = { [Op.in]: ['employee', 'coordinator'] };
      }

      const total = await User.count({ where: whereConditions });

      const users = await User.findAll({
        where: whereConditions,
        attributes: ['id', 'login', 'full_name', 'email', 'role', 'is_active', 'created_at', 'last_login'],
        order: [[filters.sort_by || 'created_at', filters.sort_order || 'desc']],
        limit: filters.limit,
        offset: (filters.page - 1) * filters.limit
      });

      const totalPages = Math.ceil(total / filters.limit);

      return ApiResponse.success(res, {
        users,
        pagination: {
          current_page: filters.page,
          total_pages: totalPages,
          total_records: total,
          records_per_page: filters.limit
        }
      }, 'Users retrieved successfully');

    } catch (error) {
      console.error('Get users error:', error);
      return ApiResponse.error(res, 'Failed to retrieve users');
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const requestingUserId = req.user!.id;
      const userRole = req.user!.role;

      if (!Validator.isValidId(userId)) {
        return ApiResponse.error(res, 'Invalid user ID', 400);
      }

      // Users can only view their own profile unless they're admin/coordinator
      if (userRole === 'employee' && userId !== requestingUserId) {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const user = await User.findByPk(userId, {
        attributes: ['id', 'login', 'full_name', 'email', 'role', 'is_active', 'created_at', 'last_login']
      });

      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      // Coordinators cannot view admin users
      if (userRole === 'coordinator' && user.role === 'admin') {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      return ApiResponse.success(res, user, 'User retrieved successfully');

    } catch (error) {
      console.error('Get user by ID error:', error);
      return ApiResponse.error(res, 'Failed to retrieve user');
    }
  }

  async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user!.role;
      
      // Only admins can create users
      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Only administrators can create users');
      }

      const userData = Sanitizer.validateAndSanitizeUser(req.body);
      const { error, value } = Validator.validateUser(userData);
      
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      // Check if login already exists
      const existingLogin = await User.findOne({
        where: { login: value.login.toLowerCase() }
      });
      
      if (existingLogin) {
        return ApiResponse.error(res, 'Login already exists', 409);
      }

      // Check if email already exists
      const existingEmail = await User.findOne({
        where: { email: value.email }
      });
      
      if (existingEmail) {
        return ApiResponse.error(res, 'Email already exists', 409);
      }

      const user = await User.create({
        login: value.login.toLowerCase(),
        password_hash: value.password, // Will be hashed by model hook
        full_name: value.full_name,
        email: value.email,
        role: value.role,
        is_active: value.is_active
      });

      const createdUser = await User.findByPk(user.id, {
        attributes: ['id', 'login', 'full_name', 'email', 'role', 'is_active', 'created_at']
      });

      return ApiResponse.success(res, createdUser, 'User created successfully', 201);

    } catch (error) {
      console.error('Create user error:', error);
      return ApiResponse.error(res, 'Failed to create user');
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const requestingUserId = req.user!.id;
      const userRole = req.user!.role;

      if (!Validator.isValidId(userId)) {
        return ApiResponse.error(res, 'Invalid user ID', 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      // Permission checks
      if (userRole === 'employee' && userId !== requestingUserId) {
        return ApiResponse.forbidden(res, 'Access denied');
      }
      
      if (userRole === 'coordinator' && user.role === 'admin') {
        return ApiResponse.forbidden(res, 'Cannot modify admin users');
      }

      const allowedFields = userRole === 'admin' ? 
        ['full_name', 'email', 'role', 'is_active'] : 
        ['full_name', 'email'];

      const updateData = Sanitizer.sanitizeObjectKeys(req.body, allowedFields);
      const { error, value } = Validator.validateUserUpdate(updateData);
      
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      // Check email uniqueness if being updated
      if (value.email && value.email !== user.email) {
        const existingEmail = await User.findOne({
          where: { 
            email: value.email,
            id: { [Op.ne]: userId }
          }
        });
        
        if (existingEmail) {
          return ApiResponse.error(res, 'Email already exists', 409);
        }
      }

      await user.update(value);

      const updatedUser = await User.findByPk(userId, {
        attributes: ['id', 'login', 'full_name', 'email', 'role', 'is_active', 'created_at', 'updated_at']
      });

      return ApiResponse.success(res, updatedUser, 'User updated successfully');

    } catch (error) {
      console.error('Update user error:', error);
      return ApiResponse.error(res, 'Failed to update user');
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const requestingUserId = req.user!.id;
      const userRole = req.user!.role;

      if (!Validator.isValidId(userId)) {
        return ApiResponse.error(res, 'Invalid user ID', 400);
      }

      // Only admins can delete users
      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Only administrators can delete users');
      }

      // Cannot delete self
      if (userId === requestingUserId) {
        return ApiResponse.error(res, 'Cannot delete your own account', 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      await user.destroy();

      return ApiResponse.success(res, null, 'User deleted successfully');

    } catch (error) {
      console.error('Delete user error:', error);
      return ApiResponse.error(res, 'Failed to delete user');
    }
  }

  async resetPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const userRole = req.user!.role;
      const { new_password } = req.body;

      if (!Validator.isValidId(userId)) {
        return ApiResponse.error(res, 'Invalid user ID', 400);
      }

      // Only admins can reset passwords
      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Only administrators can reset passwords');
      }

      if (!new_password || new_password.length < 6) {
        return ApiResponse.error(res, 'Password must be at least 6 characters long', 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      await user.update({
        password_hash: new_password // Will be hashed by model hook
      });

      return ApiResponse.success(res, null, 'Password reset successfully');

    } catch (error) {
      console.error('Reset password error:', error);
      return ApiResponse.error(res, 'Failed to reset password');
    }
  }

  async getEmployees(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = Validator.sanitizeAndValidateFilters(req.query);
      
      const whereConditions: any = { is_active: true };
      
      if (filters.search) {
        whereConditions[Op.or] = [
          { full_name: { [Op.iLike]: `%${filters.search}%` } },
          { position: { [Op.iLike]: `%${filters.search}%` } },
          { department: { [Op.iLike]: `%${filters.search}%` } }
        ];
      }

      const total = await Employee.count({ where: whereConditions });

      const employees = await Employee.findAll({
        where: whereConditions,
        order: [['full_name', 'asc']],
        limit: filters.limit,
        offset: (filters.page - 1) * filters.limit
      });

      const totalPages = Math.ceil(total / filters.limit);

      return ApiResponse.success(res, {
        employees,
        pagination: {
          current_page: filters.page,
          total_pages: totalPages,
          total_records: total,
          records_per_page: filters.limit
        }
      }, 'Employees retrieved successfully');

    } catch (error) {
      console.error('Get employees error:', error);
      return ApiResponse.error(res, 'Failed to retrieve employees');
    }
  }

  async createEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user!.role;
      
      // Only coordinators and admins can create employees
      if (userRole === 'employee') {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const employeeData = Sanitizer.validateAndSanitizeEmployee(req.body);
      const { error, value } = Validator.validateEmployee(employeeData);
      
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      const employee = await Employee.create(value);

      return ApiResponse.success(res, employee, 'Employee created successfully', 201);

    } catch (error) {
      console.error('Create employee error:', error);
      return ApiResponse.error(res, 'Failed to create employee');
    }
  }

  async updateEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = parseInt(req.params.id);
      const userRole = req.user!.role;

      if (!Validator.isValidId(employeeId)) {
        return ApiResponse.error(res, 'Invalid employee ID', 400);
      }

      // Only coordinators and admins can update employees
      if (userRole === 'employee') {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const employee = await Employee.findByPk(employeeId);
      if (!employee) {
        return ApiResponse.notFound(res, 'Employee not found');
      }

      const employeeData = Sanitizer.validateAndSanitizeEmployee(req.body);
      const { error, value } = Validator.validateEmployee(employeeData);
      
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      await employee.update(value);

      return ApiResponse.success(res, employee, 'Employee updated successfully');

    } catch (error) {
      console.error('Update employee error:', error);
      return ApiResponse.error(res, 'Failed to update employee');
    }
  }

  async deleteEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = parseInt(req.params.id);
      const userRole = req.user!.role;

      if (!Validator.isValidId(employeeId)) {
        return ApiResponse.error(res, 'Invalid employee ID', 400);
      }

      // Only admins can delete employees
      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Only administrators can delete employees');
      }

      const employee = await Employee.findByPk(employeeId);
      if (!employee) {
        return ApiResponse.notFound(res, 'Employee not found');
      }

      // Soft delete by setting is_active to false
      await employee.update({ is_active: false });

      return ApiResponse.success(res, null, 'Employee deactivated successfully');

    } catch (error) {
      console.error('Delete employee error:', error);
      return ApiResponse.error(res, 'Failed to delete employee');
    }
  }
}

export default new UserController();