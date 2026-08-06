import type { Request, Response, NextFunction } from "express";
import { loginUser, registerUser, verifyRegisterOtp } from "./auth.service.js";
import { createSession } from "../session/session.manager.js";
import { removeSpecificSession } from "../session/session.manager.js";

async function handleAsync(
	handler: (req: Request, res: Response) => Promise<void>,
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		await handler(req, res);
	} catch (error) {
		next(error);
	}
}

export function registerUserController(req: Request, res: Response, next: NextFunction) {
	return handleAsync(async (request, response) => {
		const result = await registerUser(request.body);
		response.status(201).json(result);
	}, req, res, next);
}

export function loginUserController(req: Request, res: Response, next: NextFunction) {
	return handleAsync(async (request, response) => {
		const result = await loginUser(request.body);
		const sessionId = await createSession(result.user.id, request);
		response.cookie("sessionId", sessionId, {
			httpOnly: true,
			sameSite: "lax",
			maxAge: 24 * 60 * 60 * 1000,
		});
		response.status(200).json({
			...result,
			sessionId,
		});
	}, req, res, next);
}

export function verifyRegisterOtpController(req: Request, res: Response, next: NextFunction) {
	return handleAsync(async (request, response) => {
		const result = await verifyRegisterOtp(request.body);
		response.status(200).json(result);
	}, req, res, next);
}

export function currentUserController(req: Request, res: Response, next: NextFunction) {
	return handleAsync(async (request, response) => {
		if (!request.auth) {
			throw new Error("Authentication required");
		}

		response.status(200).json({
			message: "Current user fetched successfully",
			user: request.auth.user,
			session: request.auth.session,
		});
	}, req, res, next);
}

export function logoutUserController(req: Request, res: Response, next: NextFunction) {
	return handleAsync(async (request, response) => {
		if (!request.auth) {
			throw new Error("Authentication required");
		}

		const result = await removeSpecificSession(request.auth.user.id, request.auth.session.sessionId);
		response.clearCookie("sessionId");
		response.status(result.success ? 200 : 404).json(result);
	}, req, res, next);
}
