import type { Implementation } from '@modelcontextprotocol/sdk/types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { McpServerDO } from '@xava-labs/mcp';
import {
	type AlertsResponse,
	type PointsResponse,
	type ForecastResponse,
	type ForecastPeriod,
	NWS_API_BASE,
	makeNWSRequest,
	formatAlert,
} from './utils';

export class WeatherMCP extends McpServerDO<Env> {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	getImplementation(): Implementation {
		return {
			name: 'weather',
			version: '0.0.1',
		};
	}

	configureServer(server: McpServer) {
		// Register weather tools
		server.tool(
			'get-alerts',
			'Get weather alerts for a state',
			{
				state: z.string().length(2).describe('Two-letter state code (e.g. CA, NY)'),
			},
			async ({ state }) => {
				const stateCode = state.toUpperCase();
				const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
				const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

				if (!alertsData) {
					return {
						content: [
							{
								type: 'text',
								text: 'Failed to retrieve alerts data',
							},
						],
					};
				}

				const features = alertsData.features || [];
				if (features.length === 0) {
					return {
						content: [
							{
								type: 'text',
								text: `No active alerts for ${stateCode}`,
							},
						],
					};
				}

				const formattedAlerts = features.map(formatAlert);
				const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join('\n')}`;

				return {
					content: [
						{
							type: 'text',
							text: alertsText,
						},
					],
				};
			}
		);

		server.tool(
			'get-forecast',
			'Get weather forecast for a location',
			{
				latitude: z.number().min(-90).max(90).describe('Latitude of the location'),
				longitude: z.number().min(-180).max(180).describe('Longitude of the location'),
			},
			async ({ latitude, longitude }) => {
				// Get grid point data
				const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
				const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

				if (!pointsData) {
					return {
						content: [
							{
								type: 'text',
								text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
							},
						],
					};
				}

				const forecastUrl = pointsData.properties?.forecast;
				if (!forecastUrl) {
					return {
						content: [
							{
								type: 'text',
								text: 'Failed to get forecast URL from grid point data',
							},
						],
					};
				}

				// Get forecast data
				const forecastData = await makeNWSRequest<ForecastResponse>(forecastUrl);
				if (!forecastData) {
					return {
						content: [
							{
								type: 'text',
								text: 'Failed to retrieve forecast data',
							},
						],
					};
				}

				const periods = forecastData.properties?.periods || [];
				if (periods.length === 0) {
					return {
						content: [
							{
								type: 'text',
								text: 'No forecast periods available',
							},
						],
					};
				}

				// Format forecast periods
				const formattedForecast = periods.map((period: ForecastPeriod) =>
					[
						`${period.name || 'Unknown'}:`,
						`Temperature: ${period.temperature || 'Unknown'}°${period.temperatureUnit || 'F'}`,
						`Wind: ${period.windSpeed || 'Unknown'} ${period.windDirection || ''}`,
						`${period.shortForecast || 'No forecast available'}`,
						'---',
					].join('\n')
				);

				const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join('\n')}`;

				return {
					content: [
						{
							type: 'text',
							text: forecastText,
						},
					],
				};
			}
		);
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// Create a `DurableObjectId` for an instance of the `MyDurableObject`
		// class named "foo". Requests from all Workers to the instance named
		// "foo" will go to a single globally unique Durable Object instance.
		const id: DurableObjectId = env.WEATHER_MCP.idFromName('weather');

		// Create a stub to open a communication channel with the Durable
		// Object instance.
		const stub = env.WEATHER_MCP.get(id);

		return await stub.fetch(request);
	},
} satisfies ExportedHandler<Env>;
