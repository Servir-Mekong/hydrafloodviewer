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
        public_methods = ['get-map-id', 'get-permanent-water', 'get-precipmap']
        if action in public_methods:
            date = get('date', '2016-07-14')
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
            elif action == 'get-permanent-water':
                data = core.getHistoricalMap(startYear=startYear, endYear=endYear, startMonth=startMonth, endMonth=endMonth, method=method, wcolor=wcolor, climatology=False, algorithm='JRC', shape=geom)
            elif action == 'get-precipmap':
                data = core.getPrecipMap(date=precipdate, accumulation=1, cmap_name=cmap)
            return JsonResponse(data, safe=False)
