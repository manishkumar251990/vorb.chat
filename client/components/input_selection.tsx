import * as React from 'react';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

import { useRoomConnect, useInputDevices, useInputControl, useInputStream, useInputConfiguration, useResolution, useTrackDeviceId, useTrackEnabled } from './rtc_room';
import { StreamVideo } from './peer_view';

import { Switch, SwitchProps } from '@rmwc/switch';
import '@rmwc/switch/styles';
import { Select, SelectProps } from '@rmwc/select';
import '@rmwc/select/styles';
import { resolutions, sanitizeInputConfiguration, ResolutionKey, TrackKind } from '../input_control';

const DEVICE_NAMES = {
  audio: 'Microphone',
  video: 'Camera',
};

interface ResolutionSelectProps extends SelectProps {
}

const ResolutionSelect: React.SFC<ResolutionSelectProps> = (other) => {
  const control = useInputControl();
  const resolution = useResolution();

  const changeCb = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if(control == null) {
      return;
    }

    control.setResolution(e.target.value as ResolutionKey);
  }, [control]);

  const options = Object.entries(resolutions).map(([id, res]) => {
    const [width, height] = res.dimensions;
    return <option key={id} value={id}>{res.name} ({width}x{height})</option>
  });

  return <Select label="Preferred Resolution" value={resolution} onChange={changeCb} {...other}>
    {options}
  </Select>
};

interface DeviceSelectProps extends SelectProps {
  kind: TrackKind;
}

const DeviceSelect: React.SFC<DeviceSelectProps> = ({ kind, disabled, ...other }) => {
  const control = useInputControl();
  const deviceId = useTrackDeviceId(kind);
  const devices = useInputDevices(kind);

  const deviceName = DEVICE_NAMES[kind];

  const onChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if(control == null) {
      return;
    }

    control.setDeviceId(kind, e.target.value);
  }, [control]);

  let options: React.ReactNode;

  if(devices != null) {
    options = devices.map(({ deviceId, label }, index) => {
      if(!label) {
        label = deviceId == "default" ? "Default" : `${deviceName} ${index}`;
      }

      return <option key={deviceId} value={deviceId}>{label}</option>
    });
  } else {
    disabled = true;
  }

  let placeholder: string | undefined;

  if(devices == null || devices.length == 0) {
    placeholder = `No ${deviceName.toLowerCase()} found`;
  }

  // TODO bad hack around rmwc bug, remove
  const key = devices != null ? devices[devices.length-1]?.label : undefined;

  return <Select key={key} label={deviceName} placeholder={placeholder} {...other} disabled={disabled} value={deviceId} onChange={onChange}>
    {options}
  </Select>
}

interface DeviceEnabledSwitchProps extends SwitchProps {
  kind: TrackKind;
}

const DeviceEnabledSwitch: React.SFC<DeviceEnabledSwitchProps> = ({ kind, ...other }) => {
  const control = useInputControl();
  const enabled = useTrackEnabled(kind);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if(control == null) {
      return;
    }

    control.setDeviceEnabled(kind, e.target.checked);
  }, [control]);

  return <Switch checked={enabled} onChange={onChange} {...other} />
}

export const InputSelection: React.SFC = ({ }) => {
  const stream = useInputStream();
  const audioEnabled = useTrackEnabled('audio');
  const videoEnabled = useTrackEnabled('video');

  // actual render

  return <>
    <div className="video_preview">
      <StreamVideo stream={stream} muted />
    </div>
    <br/>
    <br/>
    <div>
      <DeviceEnabledSwitch kind="audio" label="Audio" />
      <DeviceSelect disabled={!audioEnabled} kind="audio" />
    </div>
    <br/>
    <div>
      <DeviceEnabledSwitch kind="video" label="Video" />
      <DeviceSelect disabled={!videoEnabled} kind="video" />
      <ResolutionSelect disabled={!videoEnabled} />
    </div>
  </>;
}
