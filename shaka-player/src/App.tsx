/* eslint-disable react-hooks/exhaustive-deps */
import './App.css';
import { useQuery } from '@apollo/client';
import { useState, useEffect } from 'react';
import { useMutation } from "@apollo/client";
import { ReactShakaPlayer } from "@mkhuda/react-shaka-player";
import "@mkhuda/react-shaka-player/dist/ui.css";
import { ALL_FILES } from './graphql/queries';
import { AllFiles, File } from './types/file';
import React from 'react';
import { Socket } from 'socket.io-client';

import { DELETE_FILE, SINGLE_UPLOAD } from './graphql/mutation';


function round(num: number) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}


const UploadFile = (props: Record<string, any>) => {
  const [mutate, { loading, error }] = useMutation(SINGLE_UPLOAD, {
    onCompleted: () => {
      if (props.onUploadSuccess) {
        props.onUploadSuccess();
      }
    }
  });
  const onChange = ({
    target: {
      validity,
      files: [file]
    }
  }: any) =>{
    return validity.valid && mutate({ variables: { file } });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{JSON.stringify(error, null, 2)}</div>;

  return (
    <React.Fragment>
      <input type="file" required onChange={onChange} />
    </React.Fragment>
  );
};

const DeleteFile = (props: Record<string, any>) => {
  const [mutate, { loading, error }] = useMutation(DELETE_FILE, {
    onCompleted: () => {
      if (props.onDeleteSuccess) {
        props.onDeleteSuccess();
      }
    }
  });


  function deleteVideo(id: string) {
    mutate({ variables: { id } });
  }


  if (loading) return <div>Loading...</div>;
  if (error) return <div>{JSON.stringify(error, null, 2)}</div>;

  return (
    <React.Fragment>
      <button onClick={() => deleteVideo(props.id as string)}>Delete</button>
    </React.Fragment>
  );
};

function App(props: { pubsub: Socket } & Record<string, any>) {
 
  let [mainPlayer, setMainPlayer] = useState<Record<string, any>>({});

  const [files, setFiles] = useState<File[]>([]);

  const [drm, setDRM] = useState<{ id: string, key: string } | null>(null);

  const { data, loading, refetch } = useQuery<AllFiles>(ALL_FILES, {
    onError: (e) => {
      console.warn(e);
    },
    onCompleted: (response) => {
      const { files } = response;
      setFiles(files);
    },
  });
  
  useEffect(() => {
    if (!loading) {
      let _files = Array.from(data?.files  || []);
      setFiles(_files);
      console.log('_files', _files);
      props.pubsub.on('progress', (message: string) => {
        const response = JSON.parse(message);
        if (response.progress >= 1) {
          console.log('refetch')
          void refetch();
        } else {
          _files = _files.map(file => {
            if (file.id === response.id) 
              return {
                ...file,
                progress: response.progress
              };
            return file;
          });
          setFiles(_files);
        }
      });
    }
  }, [loading, data, refetch]);

  async function playVideo(id: string, url: string) {
   try {
      const { player, videoElement } = mainPlayer;
      if (!player) return;
      if (drm) {
        player.configure({
          drm: {
            clearKeys: { [id]: drm.key }
          },
        })
      }
      await player.load(url);
      videoElement.play();
   }catch(error) {
    console.log('error', error)
   }
    
  }
  
  function renderTableData() {
    return files.map((file, index) => {
      const { id, fileName, url } = file;
      const progress = (file.progress || 0) * 100;
      let status = 'READY';
      if (file.status !== 'READY') {
        status = `${round(progress)}%`
      }
      return (
          <tr key={id}>
            <td>{id}</td>
            <td>{fileName}</td>
            <td>{status}</td>
            <td>
              <button onClick={() => playVideo(id as string, url as string)}>Play</button>
              <DeleteFile 
                id={id} 
                onDeleteSuccess={() => {
                  void refetch();
                }}
              />
            </td>
          </tr>
      )
    })
  }

  function renderTableHeader() {

    let header = [
      'id', 'fileName', 'status', 'action'
    ];

    return header.map((key, index) => {
       return <th key={index}>{key.toUpperCase()}</th>
    })
 }




  return (
    <div className="App">
      <div style={ { height: '720px', width: '1080px', margin: '0 auto' } }>
        <ReactShakaPlayer className="shaka-player" onLoad={(player) => setMainPlayer(player)} />
      </div>
      <div>
        <div>
          <UploadFile 
            onUploadSuccess={() => {
              void refetch();
            }} 
          />
          <div>
            DRM
            key: <input type="text" onChange={event => setDRM({ ...(drm || { id: '' }), key: event.target.value })} />
          </div>
        </div>
        <h1 id='title'>FILES</h1>
        <table id='files'>
          <tbody>
            <tr>{renderTableHeader()}</tr>
            {renderTableData()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
