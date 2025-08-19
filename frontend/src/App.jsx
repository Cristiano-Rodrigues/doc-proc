import { useEffect, useRef, useState } from 'react';
import { GoUpload } from "react-icons/go";
import { LuLayoutDashboard } from "react-icons/lu";
import { CiCircleList } from "react-icons/ci";
import { GoFile } from "react-icons/go";
import { LuWeight } from "react-icons/lu";
import { CiCalendarDate } from "react-icons/ci";
import { GoPerson } from "react-icons/go";
import { RiBuilding2Line } from "react-icons/ri";

export default function App() {
  const inputRef = useRef(null)
  const [data, setData] = useState([])
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false)
  const [fileData, setFileData] = useState(null)
  const [error, setError] = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/metadados')
        const result = await response.json()

        console.log(result)
        setData(result)
      } catch (error) {
        console.log(error)
        setData(null)
      }
    }
    fetchData()
  }, [])

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setFileData(null)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/analisar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar o documento.');
      }

      const fileData = await response.json();
      setFileData(fileData);
    } catch (error) {
      console.error(error);
      setError(error)
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchRef.current || searchRef.current.value == '') {
      return
    }
    const q = searchRef.current.value

    const response = await fetch(`http://localhost:3000/buscar?q=${encodeURI(q)}`)
    const result = await response.json()

    console.log('search', result)
    setData(result)
  }

  return (
    <main className='flex flex-col gap-8 p-8'>
      <div className='flex flex-col justify-center items-center'>
        <h1 className='font-bold text-2xl'>Sistema de gestão de documentos</h1>
        <p>Faça upload, classifique e procure por seus documentos com processamento inteligente de AI e detecção de duplicação</p>
      </div>
      <div className='border-1 border-gray-200 p-4 rounded-md flex flex-col gap-4'>
        <p>Submeta o documento</p>
        <div className='border-1 border-dashed border-gray-200 p-4 rounded-md flex flex-col justify-center items-center gap-2'>
          <div className='flex justify-center items-center w-[50px] h-[50px] rounded-full bg-gray-200'>
            <GoUpload />
          </div>
          <p className='font-bold text-xl'>Arraste seu documento para aqui</p>
          <p className='text-gray-500'>Ou clique para procurar nos ficheiros</p>
          <input onChange={handleFileChange} ref={inputRef} type="file" accept='application/pdf' hidden />
          <button onClick={e => {
            if (!file) {
              inputRef.current?.click()
            } else {
              handleSubmit(e)
            }
          }} className='bg-black text-white rounded-md px-2 cursor-pointer'>{
            file != null ? 'Enviar arquivo' : 'Escolha o arquivo'}</button>
            { isLoading && 'Aguarde...' }
        </div>
        {
          error && (
            <div className="flex p-2 gap-2 flex-col">
              <p className='flex p-2 bg-red-50 rounded-md gap-2'>Erro ao analisar o arquivo!</p>
            </div>
          )
        }
        {
          fileData && (
            <div className='flex p-2 gap-2 flex-col'>
              <p className='flex p-2 bg-green-50 rounded-md gap-2'>Arquivo submetido e analisado com sucesso!</p>
              <div className='flex gap-2'>
                <div className="flex flex-col w-1/2 border-1 border-gray-100 p-2 rounded-md">
                  <p className='font-bold'>Dados do arquivo</p>
                  <div className='flex flex-col gap-2 p-4 rounded-md w-full'>
                    <div className='flex gap-2 items-center'>
                      <GoFile />
                      <p>{ fileData.metadata.title }</p>
                    </div>
                    <div className='flex px-2 rounded-full bg-gray-200 w-fit'>
                      <div>{fileData.metadata.type ?? 'N/A' }</div>
                    </div>
                    <div className='flex justify-between mt-3 border-b-1 border-gray-200 pb-2'>
                      <div className='flex gap-2 items-center'>
                        <p><LuWeight /></p>
                        <p>{ fileData.metadata?.size?.toFixed(1) } KB</p>
                      </div>
                      <div className='flex gap-2 items-center'>
                        <p><CiCalendarDate /></p>
                        <p>{ fileData.metadata?.createdAt?.split('T')[0] }</p>
                      </div>
                    </div>
                    <div className='flex flex-col gap-2'>
                      <div className='flex gap-2 items-center'>
                        <p><GoPerson /></p>
                        <p>Autor:</p>
                        <p>{ fileData.metadata.author ?? 'N/A' }</p>
                      </div>
                      <div className='flex gap-2 items-center'>
                        <p><RiBuilding2Line /></p>
                        <p>Emissor:</p>
                        <p>{ fileData.metadata.issuing_body ?? 'N/A' }</p>
                      </div>
                      <div className='flex gap-2 items-center'>
                        <p><CiCalendarDate /></p>
                        <p>Última modificação:</p>
                        <p>{ fileData.metadata?.modifiedAt?.split('T')[0] }</p>
                      </div>
                    </div>
                    <div className='flex justify-between'>
                      <div>
                        <p>Páginas</p>
                        <p className='text-xs font-bold'>{ fileData.metadata.pages }</p>
                      </div>
                      <div>
                        <p>Língua</p>
                        <p className='text-xs font-bold'>{ fileData.metadata.language ?? 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <p>Sumário</p>
                      <p className="text-gray-600 text-xs">
                        {
                          fileData.metadata?.summary?.slice(0, 200) + (fileData.metadata.summary?.length > 200 ? '...' : '')
                        }
                      </p>
                    </div>
                    <div className='flex gap-2 flex-col'>
                      <p>Tags</p>
                      <div className='flex gap-2 flex-wrap'>
                        { !fileData.metadata.tags || fileData.metadata?.tags?.length == 0 ? <p className='text-xs'>Nenhuma tag encontrada</p> : fileData.metadata.tags?.map((tag, i) => (
                          <div key={i} className='px-2 rounded-full text-sm bg-gray-200'>{tag}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex w-1/2 border-1 border-gray-100 p-2 rounded-md flex-col gap-2">
                  <p className='font-bold mb-2'>Nível de similaridade com outros documentos</p>
                  <div className='flex flex-col gap-2'>
                    {
                      fileData.similarities?.map((s, i) => (
                        <div className="flex gap-2 bg-gray-100 p-2 rounded-md" key={i}>
                          <p><span className='font-bold text-xs'>Documento:</span> {s.document}</p>
                          <p><span className='font-bold text-xs'>Similaridade:</span> {s.similarity}</p>
                        </div>
                      ))
                    }

                  </div>
                </div>
              </div>
            </div>
          )
        }
      </div>
      <div className='flex flex-col gap-2'>
        <p>Pesquise por documentos</p>
        <div className='flex border-1 border-gray-200 rounded-md p-3 gap-3'>
          <input ref={searchRef} type="text" className='px-4 py-1 rounded-md bg-gray-100 text-gray-800 w-full outline-none' placeholder='Pesquise por nome, conteúdo, autor...' />
          <button onClick={handleSearch} className='px-4 py-2 rounded-sm bg-black text-white cursor-pointer'>Pesquisar</button>
        </div>
      </div>
      <div className='border-1 border-gray-200 rounded-md p-4 flex flex-col gap-4 cursor-pointer'>
        <p>Filtrar por tags</p>
        <div className='flex gap-2'>
          <div className='px-2 rounded-full text-sm bg-gray-200'>tag-name</div>
          <div className='px-2 rounded-full text-sm bg-gray-200'>tag-name</div>
          <div className='px-2 rounded-full text-sm bg-gray-200'>tag-name</div>
        </div>
      </div>
      <div className='flex flex-col gap-3'>
        <div className='flex w-full items-center justify-between'>
          <p className='font-bold text-xl'>Seus documentos</p>
          <p className='text-xs'>{ data.length} documento(s)</p>
        </div>
        <div className='flex gap-2 items-center'>
          Vista: 
          <div className='flex rounded-sm overflow-hidden w-[80px] h-[40px] border-1 border-gray-200'>
            <div className='flex justify-center items-center w-1/2 cursor-pointer hover:bg-gray-900 hover:text-white transition-[300ms]'>
              <LuLayoutDashboard />
            </div>
            <div className='flex justify-center items-center w-1/2 cursor-pointer hover:bg-gray-900 hover:text-white transition-[300ms]'>
              <CiCircleList />
            </div>
          </div>
        </div>
        <div id='list' className='flex gap-5 flex-wrap'>
          {
            data.map((iten, i) => (
              <div key={i} className='flex flex-col gap-2 p-4 border-1 border-gray-200 rounded-md min-w-[300px] w-[calc(1/3*100%-2*8px)]'>
                <div className='flex gap-2 items-center'>
                  <GoFile />
                  <p>{ iten.title }</p>
                </div>
                <div className='flex px-2 rounded-full bg-gray-200 w-fit'>
                  <div>{iten.type ?? 'N/A' }</div>
                </div>
                <div className='flex justify-between mt-3 border-b-1 border-gray-200 pb-2'>
                  <div className='flex gap-2 items-center'>
                    <p><LuWeight /></p>
                    <p>{ iten?.size?.toFixed(1) } KB</p>
                  </div>
                  <div className='flex gap-2 items-center'>
                    <p><CiCalendarDate /></p>
                    <p>{ iten?.createdAt?.split('T')[0] }</p>
                  </div>
                </div>
                <div className='flex flex-col gap-2'>
                  <div className='flex gap-2 items-center'>
                    <p><GoPerson /></p>
                    <p>Autor:</p>
                    <p>{ iten.author ?? 'N/A' }</p>
                  </div>
                  <div className='flex gap-2 items-center'>
                    <p><RiBuilding2Line /></p>
                    <p>Emissor:</p>
                    <p>{ iten.issuing_body ?? 'N/A' }</p>
                  </div>
                  <div className='flex gap-2 items-center'>
                    <p><CiCalendarDate /></p>
                    <p>Última modificação:</p>
                    <p>{ iten?.modifiedAt?.split('T')[0] }</p>
                  </div>
                </div>
                <div className='flex justify-between'>
                  <div>
                    <p>Páginas</p>
                    <p className='text-xs font-bold'>{ iten.pages }</p>
                  </div>
                  <div>
                    <p>Língua</p>
                    <p className='text-xs font-bold'>{ iten.language ?? 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p>Sumário</p>
                  <p className="text-gray-600 text-xs">
                    {
                      iten.summary?.slice(0, 100) + (iten.summary?.length > 100 ? '...' : '')
                    }
                  </p>
                </div>
                <div className='flex gap-2 flex-col'>
                  <p>Tags</p>
                  <div className='flex gap-2 flex-wrap'>
                    { !iten.tags || iten?.tags?.length == 0 ? <p className='text-xs'>Nenhuma tag encontrada</p> : iten.tags?.map((tag, i) => (
                      <div key={i} className='px-2 rounded-full text-sm bg-gray-200'>{tag}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </main>
  )
}
