# -*- coding: utf-8 -*-

from celery.result import AsyncResult
from core import GEEApi
from django.conf import settings
from django.http import JsonResponse
from datetime import datetime
import json
import time

def api(request):

    get = request.GET.get
    action = get('action', '')

    if action:
        public_methods = ['get-map-id', 'get-permanent-water', 'get-precipmap', 'get-date-list', 'download-flood-map', 'get-feeds-data', 'get-floods-id']
        if action in public_methods:
            date = get('date', '')
            shape = get('shape', '')
            geom = get('geom', '')
            fcolor = get('fcolor', '')
            sensor = get('sensor', '')
            startYear = get('startYear', '')
            endYear = get('endYear', '')
            startMonth = get('startMonth', '')
            endMonth = get('endMonth', '')
            method = get('method', '')
            wcolor = get('wcolor', '')
            accum = get('accum', '')
            cmap = get('cmap', '')
            precipdate = get('precipdate', '')
            core = GEEApi(date, shape, geom, fcolor, sensor )
            if action == 'get-map-id':
                data = core.get_map_id(date=date, fcolor=fcolor, sensor=sensor, shape=geom)
            elif action == 'get-floods-id':
                data = core.get_flood_id(date=date, fcolor=fcolor, sensor=sensor, shape=geom)
            elif action == 'get-permanent-water':
                data = core.getHistoricalMap(startYear=startYear, endYear=endYear, startMonth=startMonth, endMonth=endMonth, method=method, wcolor=wcolor, climatology=False, algorithm='JRC', shape=geom)
            elif action == 'get-precipmap':
                data = core.getPrecipMap(date=precipdate, accumulation=1, cmap_name=cmap)
            elif action == 'get-date-list':
                sensor_date_list = get('snsr', '')
                data = core.dateList(snsr=sensor_date_list)
            elif action == 'get-feeds-data':
                data = core.getFeeds()
            elif action == 'download-flood-map':
                download_date = get('download_date', '')
                download_snsr = get('download_snsr', '')
                download_shape = get('download_shape', '')
                data = core.getDownloadURL(download_date, download_snsr, download_shape)
            return JsonResponse(data, safe=False)
