from django.shortcuts import render
from django.core.urlresolvers import reverse
import ee
from ee.ee_exception import EEException
import datetime


def mapviewer(request):
    """
    Controller for the app home page.
    """
    if request.method == 'GET':
        info = request.GET
    else:
        info = request.POST
    event_content = request.POST['text']
    start_date = request.POST['sDate']
    sensor = request.POST['sensor_txt']
    viewer = request.POST['viewer']
    print(request)

    context = {
        'event_content': event_content,
        'sensor': sensor,
        'event_date': start_date

    }

    return render(request, 'usecase-viewer.html', context)
